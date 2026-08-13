import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { CITIES, WEATHER_STATES } from "./catalog.mjs";

const execFileAsync = promisify(execFile);
const manifest = JSON.parse(await readFile(new URL("./videos.json", import.meta.url), "utf8"));
const requestedCity = process.argv.find((argument) => argument.startsWith("--city="))?.split("=")[1];
const includeCandidates = process.argv.includes("--include-candidates");
const citySlugs = CITIES.map(([slug]) => slug).filter((slug) => !requestedCity || slug === requestedCity);
const expectedKeys = citySlugs.flatMap((slug) => WEATHER_STATES.map(([weather, light]) => `${slug}:${weather}:${light}`));
const accepted = manifest.items.filter((item) => (item.qa === "accepted" || (includeCandidates && item.qa === "candidate")) && citySlugs.includes(item.city));
const acceptedByKey = new Map(accepted.map((item) => [`${item.city}:${item.weather}:${item.light}`, item]));
const missing = expectedKeys.filter((key) => !acceptedByKey.has(key));
const duplicateUrls = accepted.filter((item, index) => accepted.findIndex((candidate) => candidate.url === item.url) !== index);
const failures = [];

const mediaSource = (url) => {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return new URL(`../../public${url}`, import.meta.url).pathname;
  return new URL(`../../public/${url}`, import.meta.url).pathname;
};

for (const key of missing) failures.push(`${key}: missing accepted clip`);
for (const item of duplicateUrls) failures.push(`${item.city}:${item.weather}:${item.light}: duplicate URL`);

const inspect = async (key, item) => {
  try {
    const source = mediaSource(item.url);
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,avg_frame_rate:format=duration",
      "-of", "json",
      source,
    ], { maxBuffer: 1024 * 1024 * 2 });
    const data = JSON.parse(stdout);
    const stream = data.streams?.[0];
    const duration = Number(data.format?.duration);
    if (!stream || stream.width !== 720 || stream.height !== 1280) failures.push(`${key}: expected 720x1280, found ${stream?.width}x${stream?.height}`);
    if (!Number.isFinite(duration) || duration < 4.8 || duration > 5.3) failures.push(`${key}: expected ~5 seconds, found ${duration}`);
    if (!String(stream?.avg_frame_rate ?? "").includes("24")) failures.push(`${key}: expected 24 fps, found ${stream?.avg_frame_rate}`);

    // Sample one frame per second. A large first-to-last luminance shift is a
    // reliable signature of an unwanted day/night or exposure transition and
    // also produces a visible jump at the loop boundary.
    const { stderr: signalStats } = await execFileAsync("ffmpeg", [
      "-hide_banner", "-nostats", "-loglevel", "info",
      "-i", source,
      "-vf", "fps=1,signalstats,metadata=print",
      "-f", "null", "-",
    ], { maxBuffer: 1024 * 1024 * 4 });
    const luma = [...signalStats.matchAll(/lavfi\.signalstats\.YAVG=([0-9.]+)/g)].map((match) => Number(match[1]));
    const lumaDrift = luma.length > 1 ? Math.abs(luma.at(-1) - luma[0]) : Number.NaN;
    const lumaRange = luma.length ? Math.max(...luma) - Math.min(...luma) : Number.NaN;
    if (!luma.length) failures.push(`${key}: could not sample luminance`);
    if (Number.isFinite(lumaDrift) && lumaDrift > 18) failures.push(`${key}: first/last exposure drift ${lumaDrift.toFixed(1)} is too large for a loop`);
    if (Number.isFinite(lumaRange) && lumaRange > 35) failures.push(`${key}: exposure range ${lumaRange.toFixed(1)} suggests a time or lighting transition`);

    // A loop can keep roughly the same average brightness while the camera,
    // skyline or time of day drifts. Compare the first and final usable frame
    // directly so those structural discontinuities cannot hide behind luma.
    const { stderr: similarityStats } = await execFileAsync("ffmpeg", [
      "-hide_banner", "-nostats", "-loglevel", "info",
      "-i", source,
      "-filter_complex", "[0:v]split[a][b];[a]select='eq(n,0)',setpts=PTS-STARTPTS[first];[b]select='eq(n,119)',setpts=PTS-STARTPTS[last];[first][last]ssim",
      "-an", "-f", "null", "-",
    ], { maxBuffer: 1024 * 1024 * 4 });
    const loopSimilarity = Number(similarityStats.match(/All:([0-9.]+)/)?.[1]);
    if (!Number.isFinite(loopSimilarity)) failures.push(`${key}: could not compare first and last frames`);
    // The player crossfades the final 350 ms into the first frame. A 0.89 SSIM
    // floor still rejects structural drift while allowing natural cloud motion
    // that the crossfade makes visually seamless.
    // Fog can keep the same geometry while visibly clearing. Its stricter floor
    // catches that change in opacity/visibility; other states retain a little
    // more freedom for rain, snow and cloud motion hidden by the crossfade.
    const minimumSimilarity = item.weather === "foggy" ? 0.94 : 0.89;
    if (Number.isFinite(loopSimilarity) && loopSimilarity < minimumSimilarity) failures.push(`${key}: first/last structural similarity ${loopSimilarity.toFixed(3)} is too low for a seamless ${item.weather} loop`);

    return { key, width: stream?.width, height: stream?.height, duration, fps: stream?.avg_frame_rate, lumaDrift, lumaRange, loopSimilarity };
  } catch (error) {
    failures.push(`${key}: ffprobe failed (${error.message})`);
    return null;
  }
};

const queue = expectedKeys.filter((key) => acceptedByKey.has(key));
const inspected = [];
const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
  while (queue.length) {
    const key = queue.shift();
    const result = await inspect(key, acceptedByKey.get(key));
    if (result) inspected.push(result);
  }
});
await Promise.all(workers);

console.log(JSON.stringify({ expected: expectedKeys.length, accepted: accepted.length, inspected: inspected.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
