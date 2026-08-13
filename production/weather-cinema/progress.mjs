import { readFile } from "node:fs/promises";
import { CITIES, WEATHER_STATES } from "./catalog.mjs";

const manifest = JSON.parse(await readFile(new URL("./videos.json", import.meta.url), "utf8"));
const latestByKey = new Map();

for (const item of manifest.items) {
  const key = `${item.city}:${item.weather}:${item.light}`;
  const current = latestByKey.get(key);
  if (!current || item.qa === "accepted" || current.qa !== "accepted") latestByKey.set(key, item);
}

const cities = CITIES.map(([slug, name]) => {
  const states = WEATHER_STATES.map(([weather, light]) => {
    const key = `${slug}:${weather}:${light}`;
    const item = latestByKey.get(key);
    return { key, status: item?.qa ?? "missing", id: item?.id ?? null };
  });
  return {
    slug,
    name,
    accepted: states.filter((state) => state.status === "accepted").length,
    rejected: states.filter((state) => state.status === "rejected").length,
    missing: states.filter((state) => state.status === "missing").length,
    states,
  };
});

const accepted = cities.reduce((total, city) => total + city.accepted, 0);
const total = CITIES.length * WEATHER_STATES.length;

console.log(JSON.stringify({
  accepted,
  total,
  percent: Number(((accepted / total) * 100).toFixed(1)),
  completeCities: cities.filter((city) => city.accepted === WEATHER_STATES.length).map((city) => city.slug),
  cities,
}, null, 2));
