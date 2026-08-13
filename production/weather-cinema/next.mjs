import { readFile } from "node:fs/promises";
import { CITIES, WEATHER_STATES, videoPrompt } from "./catalog.mjs";

const masters = JSON.parse(await readFile(new URL("./masters.json", import.meta.url), "utf8"));
const videos = JSON.parse(await readFile(new URL("./videos.json", import.meta.url), "utf8"));
const requestedCity = process.argv.find((argument) => argument.startsWith("--city="))?.split("=")[1];
const json = process.argv.includes("--json");

const acceptedKeys = new Set(
  videos.items
    .filter((item) => item.qa === "accepted")
    .map((item) => `${item.city}:${item.weather}:${item.light}`),
);
const masterBySlug = new Map(masters.items.map((item) => [item.slug, item]));
const city = CITIES.find(([slug]) => {
  if (requestedCity && slug !== requestedCity) return false;
  return WEATHER_STATES.some(([weather, light]) => !acceptedKeys.has(`${slug}:${weather}:${light}`));
});

if (!city) {
  const message = requestedCity
    ? `${requestedCity} already has all eight accepted clips.`
    : `All ${CITIES.length * WEATHER_STATES.length} weather clips are accepted.`;
  console.log(json ? JSON.stringify({ complete: true, message }, null, 2) : message);
  process.exit(0);
}

const [slug, name] = city;
const master = masterBySlug.get(slug);
if (!master) throw new Error(`Missing master frame for ${slug}`);
const [weather, light] = WEATHER_STATES.find(
  ([candidateWeather, candidateLight]) => !acceptedKeys.has(`${slug}:${candidateWeather}:${candidateLight}`),
);
const task = {
  complete: false,
  key: `${slug}:${weather}:${light}`,
  city: slug,
  cityName: name,
  weather,
  light,
  masterId: master.id,
  masterUrl: master.url,
  localMaster: `/tmp/tian-weather-masters/${master.id}.png`,
  prompt: videoPrompt(city, weather, light),
};

if (json) {
  console.log(JSON.stringify(task, null, 2));
} else {
  console.log([
    `NEXT ${task.key}`,
    `MASTER ${task.localMaster}`,
    `URL ${task.masterUrl}`,
    "PROMPT",
    task.prompt,
  ].join("\n"));
}
