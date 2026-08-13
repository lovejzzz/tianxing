import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { CITIES, WEATHER_STATES } from "./catalog.mjs";

const execFileAsync = promisify(execFile);
const args = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, "").split("=");
  return [key, value.join("=") || true];
}));
const required = ["key", "id", "input"];
for (const field of required) if (!args[field]) throw new Error(`Missing --${field}=...`);

const [city, weather, light] = String(args.key).split(":");
if (!CITIES.some(([slug]) => slug === city)) throw new Error(`Unknown city: ${city}`);
if (!WEATHER_STATES.some(([state, phase]) => state === weather && phase === light)) throw new Error(`Unknown state: ${weather}:${light}`);
const input = resolve(String(args.input));
const local = Boolean(args.local);
const output = local
  ? resolve(`public/media/weather/cinema/${city}-${weather}-${light}.mp4`)
  : input;
if (local) {
  await mkdir(dirname(output), { recursive: true });
  if (input !== output) await copyFile(input, output);
}

const { stdout } = await execFileAsync("ffprobe", [
  "-v", "error", "-select_streams", "v:0",
  "-show_entries", "stream=width,height,avg_frame_rate,nb_frames:format=duration",
  "-of", "json", output,
]);
const probe = JSON.parse(stdout);
const stream = probe.streams?.[0];
const duration = Number(probe.format?.duration);
if (stream?.width !== 720 || stream?.height !== 1280) throw new Error(`Expected 720x1280, found ${stream?.width}x${stream?.height}`);
if (stream?.avg_frame_rate !== "24/1") throw new Error(`Expected 24 fps, found ${stream?.avg_frame_rate}`);
if (Number(stream?.nb_frames) !== 121) throw new Error(`Expected 121 frames, found ${stream?.nb_frames}`);
if (duration < 4.8 || duration > 5.3) throw new Error(`Expected about 5 seconds, found ${duration}`);

const manifestUrl = new URL("./videos.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const key = `${city}:${weather}:${light}`;
if (manifest.items.some((item) => item.qa === "accepted" && `${item.city}:${item.weather}:${item.light}` === key)) {
  throw new Error(`${key} already has an accepted clip`);
}
const item = {
  city, weather, light, id: String(args.id),
  ...(args.sourceId ? { sourceId: String(args.sourceId) } : {}),
  url: local ? `/media/weather/cinema/${basename(output)}` : String(args.url ?? input),
  qa: "accepted",
  ...(args.postProcess ? { postProcess: String(args.postProcess) } : {}),
};
manifest.items.push(item);
await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ accepted: key, output: item.url, probe }, null, 2));
