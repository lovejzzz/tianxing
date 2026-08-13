import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { CITIES, WEATHER_STATES } from "./catalog.mjs";

const masters = JSON.parse(await readFile(new URL("./masters.json", import.meta.url), "utf8"));
const videos = JSON.parse(await readFile(new URL("./videos.json", import.meta.url), "utf8"));
const failures = [];
const expectedMasterSlugs = new Set(CITIES.map(([slug]) => slug));
const masterSlugs = new Set(masters.items.map((item) => item.slug));

for (const slug of expectedMasterSlugs) {
  if (!masterSlugs.has(slug)) failures.push(`${slug}: missing master frame`);
}
// Extra master frames are retained as a future expansion library. They do not
// expand the curated release tier unless their cities are added to CITIES.
if (masterSlugs.size !== masters.items.length) failures.push("duplicate master frame slugs");

const expectedVideoKeys = new Set(
  CITIES.flatMap(([slug]) => WEATHER_STATES.map(([weather, light]) => `${slug}:${weather}:${light}`)),
);
const accepted = videos.items.filter((item) => item.qa === "accepted");
const acceptedKeyCounts = new Map();
const acceptedUrlCounts = new Map();
for (const item of accepted) {
  const key = `${item.city}:${item.weather}:${item.light}`;
  acceptedKeyCounts.set(key, (acceptedKeyCounts.get(key) ?? 0) + 1);
  acceptedUrlCounts.set(item.url, (acceptedUrlCounts.get(item.url) ?? 0) + 1);
  if (!expectedVideoKeys.has(key)) failures.push(`${key}: unknown accepted state`);
  if (!item.id || !item.url) failures.push(`${key}: accepted clip is missing id or URL`);
}
for (const key of expectedVideoKeys) {
  const count = acceptedKeyCounts.get(key) ?? 0;
  if (count !== 1) failures.push(`${key}: expected one accepted clip, found ${count}`);
}
for (const [url, count] of acceptedUrlCounts) {
  if (count !== 1) failures.push(`${url}: reused by ${count} accepted clips`);
}
if (accepted.length !== expectedVideoKeys.size) {
  failures.push(`expected ${expectedVideoKeys.size} accepted clips, found ${accepted.length}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ready: false, failures }, null, 2));
  process.exit(1);
}

const qa = spawn(process.execPath, [new URL("./qa.mjs", import.meta.url).pathname], {
  stdio: "inherit",
});
qa.on("exit", (code) => process.exit(code ?? 1));
