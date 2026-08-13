import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { CITIES, WEATHER_STATES } from "./catalog.mjs";

const execFileAsync = promisify(execFile);
const manifest = JSON.parse(await readFile(new URL("./videos.json", import.meta.url), "utf8"));
const requestedCity = process.argv.find((argument) => argument.startsWith("--city="))?.split("=")[1];
const outputRoot = process.argv.find((argument) => argument.startsWith("--output="))?.split("=")[1] ?? "/tmp/tian-weather-contact-sheets";
const includeCandidates = process.argv.includes("--include-candidates");
const accepted = new Map(
  manifest.items
    .filter((item) => item.qa === "accepted" || (includeCandidates && item.qa === "candidate"))
    .map((item) => [`${item.city}:${item.weather}:${item.light}`, item]),
);

const cities = CITIES.map(([slug]) => slug).filter((slug) => !requestedCity || slug === requestedCity);
const summaries = [];

const mediaSource = (url) => {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return new URL(`../../public${url}`, import.meta.url).pathname;
  return new URL(`../../public/${url}`, import.meta.url).pathname;
};

for (const city of cities) {
  const cityDirectory = `${outputRoot}/${city}`;
  await mkdir(cityDirectory, { recursive: true });
  const strips = [];

  for (const [weather, light] of WEATHER_STATES) {
    const item = accepted.get(`${city}:${weather}:${light}`);
    if (!item) continue;
    const output = `${cityDirectory}/${weather}-${light}.jpg`;
    await execFileAsync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", mediaSource(item.url),
      "-vf", "fps=1,scale=144:256:flags=lanczos,tile=5x1:padding=2:margin=2:color=black",
      "-frames:v", "1", output,
    ], { maxBuffer: 1024 * 1024 * 4 });
    strips.push(output);
  }

  if (strips.length === WEATHER_STATES.length) {
    const overview = `${outputRoot}/${city}-overview.jpg`;
    const inputs = strips.flatMap((strip) => ["-i", strip]);
    await execFileAsync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      ...inputs,
      "-filter_complex", `vstack=inputs=${strips.length}`,
      overview,
    ], { maxBuffer: 1024 * 1024 * 4 });
    summaries.push(overview);
  }
}

console.log(JSON.stringify({ outputRoot, cityOverviews: summaries }, null, 2));
