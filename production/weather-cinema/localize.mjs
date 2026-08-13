import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const manifestUrl = new URL("./videos.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const pending = manifest.items.filter((item) => item.qa === "accepted" && /^https:\/\//.test(item.url));

async function validate(path) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,avg_frame_rate,nb_frames:format=duration",
    "-of", "json", path,
  ]);
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0];
  const duration = Number(probe.format?.duration);
  if (stream?.width !== 720 || stream?.height !== 1280) throw new Error(`Expected 720x1280, found ${stream?.width}x${stream?.height}`);
  if (stream?.avg_frame_rate !== "24/1") throw new Error(`Expected 24 fps, found ${stream?.avg_frame_rate}`);
  if (Number(stream?.nb_frames) !== 121) throw new Error(`Expected 121 frames, found ${stream?.nb_frames}`);
  if (duration < 4.8 || duration > 5.3) throw new Error(`Expected about 5 seconds, found ${duration}`);
}

async function localize(item) {
  const filename = `${item.city}-${item.weather}-${item.light}.mp4`;
  const output = resolve(`public/media/weather/cinema/${filename}`);
  const temporary = `${output}.download`;
  await mkdir(dirname(output), { recursive: true });
  try {
    const response = await fetch(item.url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    await writeFile(temporary, Buffer.from(await response.arrayBuffer()));
    await validate(temporary);
    await rename(temporary, output);
    item.sourceUrl = item.url;
    item.url = `/media/weather/cinema/${filename}`;
    console.log(`Localized ${item.city}:${item.weather}:${item.light}`);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

for (let index = 0; index < pending.length; index += 4) {
  await Promise.all(pending.slice(index, index + 4).map(localize));
}

await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ localized: pending.length }, null, 2));
