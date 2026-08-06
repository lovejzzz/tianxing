import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the finished portfolio home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /EduTool/);
  assert.match(html, /Slotronome/);
  assert.match(html, /Welcome to my heart\. Have fun\./);
  assert.match(html, /Welcome to my heart\.<\/span><span[^>]*>Have fun\./);
  assert.match(html, /— Tian Xing/);
  assert.doesNotMatch(html, /Portfolio · Edition 01|Selected work|2024—2026|Tian Xing delivers|Designed &amp; built by Tian Xing|New York/i);
  assert.doesNotMatch(html, /Choose an icon to open a project|Nine things I care about|makes things|systems thinking and play/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("renders a project detail route", async () => {
  const response = await render("/projects/surge-method/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Push\. Recover\. Come back stronger\./);
  assert.match(html, /View on the App Store/);
  assert.match(html, /main-hi\.png/);
});

test("embeds playable projects and full-resolution screenshots", async () => {
  const response = await render("/projects/bebop-puzzle/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Play Bebop Puzzle here/);
  assert.match(html, /https:\/\/beboppuzzle\.com/);
  assert.match(html, /bebop-live\.png/);
  assert.match(html, /FULL RESOLUTION/);
});

test("keeps the iPhone interactive and time-aware", async () => {
  const source = await readFile(new URL("../app/components/PhoneExperience.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const photoManifest = await readFile(new URL("../app/photoManifest.ts", import.meta.url), "utf8");
  const projectSource = await readFile(new URL("../app/projects.ts", import.meta.url), "utf8");
  assert.match(source, /toLocaleTimeString/);
  assert.match(source, /Go to iPhone Home screen/);
  assert.match(source, /matchMedia\("\(max-width: 560px\)"\)/);
  assert.match(source, /className="mobile-home-nav"/);
  assert.match(source, /label: "Fun"/);
  assert.match(source, /media\/about\/tian-xing-iphone4\.jpg/);
  assert.match(source, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(source, /xingpicture@gmail\.com/);
  assert.match(source, /xing_tian_lifeitself/);
  assert.match(source, /Happiness comes from\\nsolving problems\.\\n\\n— Mark Manson/);
  assert.doesNotMatch(source, /\| "maps"|MapsApp/);
  assert.equal((photoManifest.match(/media\/photos\/all\//g) ?? []).length, 28);
  const photoPaths = [...photoManifest.matchAll(/"src": "(\/media\/photos\/all\/[^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(photoPaths).size, photoPaths.length);
  assert.match(source, /Delete Photo/);
  assert.match(source, /onDeleteCapture/);
  assert.match(source, /PHOTO_HIDDEN_KEY/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /Delete Photo\?/);
  assert.match(source, /Recently Deleted/);
  assert.match(source, /role="alertdialog"/);
  assert.match(source, /permanently removed from this device/);
  assert.match(source, /scrollIntoView/);
  assert.match(source, /event\.key === "ArrowLeft"/);
  assert.match(source, /script\.google\.com\/macros\/s\/AKfycby/);
  assert.match(source, /MESSAGE_DRAFT_KEY/);
  assert.match(source, /MESSAGE_THREAD_KEY/);
  assert.match(source, /Message sent\./);
  assert.match(source, /Try Again/);
  assert.match(source, /enterKeyHint="send"/);
  assert.doesNotMatch(source, /Delivered ✓/);
  assert.match(source, /Photo Booth effects/);
  assert.match(source, /photo-viewer/);
  assert.match(source, /WeatherScene/);
  assert.match(source, /geocoding-api\.open-meteo\.com/);
  assert.match(source, /7-DAY FORECAST/);
  assert.match(source, /Switch to degrees/);
  assert.match(source, /WEATHER_CACHE_KEY/);
  assert.match(source, /precipitation_probability/);
  assert.match(source, /SUNRISE & SUNSET/);
  assert.match(source, /Dragon egg timer/);
  assert.match(source, /endTimeRef/);
  assert.match(source, /Reset timer/);
  assert.match(source, /role="slider"/);
  assert.match(source, /has hatched/);
  assert.match(source, /AudioContext/);
  assert.match(source, /watchDragon/);
  assert.match(source, /dragonCombo/);
  assert.match(styles, /dragon-bond-chip/);
  assert.match(source, /createDragonCard/);
  assert.match(source, /hydrateDragonCard/);
  assert.match(source, /dragonRarityOdds/);
  assert.match(source, /chooseDragonKind/);
  assert.match(source, /RITUAL POWER/);
  assert.match(source, /MYTHIC/);
  assert.match(styles, /dragon-rarity-forecast/);
  assert.match(source, /--ritual-charge/);
  assert.match(styles, /overflow:clip/);
  assert.match(source, /DRAGON_TRAITS/);
  assert.match(source, /visitDragon/);
  assert.match(source, /data-dragon-id/);
  assert.match(source, /BOND \+\$\{bondGain\}/);
  assert.match(styles, /dragon-pattern-speckle/);
  assert.match(styles, /is-active-dragon/);
  assert.match(styles, /fun-shared-open/);
  assert.match(source, /fun-icon-shell/);
  assert.match(source, /--launch-scale-x/);
  assert.match(source, /className="phone-product"/);
  assert.match(source, /className="phone-back"/);
  assert.match(styles, /@keyframes phone-product-flip/);
  assert.match(styles, /phone-app-layer\.is-opening\.is-from-icon/);
  assert.match(styles, /backface-visibility:hidden/);
  assert.match(styles, /device-stage\.is-immersive\{translate:none/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(source, /Draw on this note/);
  assert.match(source, /NOTES_STORAGE_KEY/);
  assert.match(source, /Search notes/);
  assert.match(source, /Undo drawing/);
  assert.match(source, /Redo drawing/);
  assert.match(source, /Toggle eraser/);
  assert.match(source, /stored on this device/);
  assert.doesNotMatch(source, /type="range"/);
  assert.match(source, /radio\.garden/);
  assert.match(source, /Surprise me again/);
  assert.equal((source.match(/media\/ios4\/icons\//g) ?? []).length, 2);
  assert.doesNotMatch(source, /Photo Portfolio/);
  for (const icon of ["messages", "calendar", "photos", "camera", "weather", "clock", "notes", "phone", "mail", "safari", "music"]) {
    await access(new URL(`../public/media/ios4/icons/${icon}.png`, import.meta.url));
  }
  assert.match(projectSource, /slug: "edutool"[\s\S]{0,180}year: "2026"/);
  assert.match(projectSource, /slug: "start-where-you-are"[\s\S]{0,180}year: "2025"/);
  assert.match(projectSource, /slug: "texas-jack"[\s\S]{0,180}year: "2024"/);
  assert.match(projectSource, /slug: "slotronome"[\s\S]{0,180}year: "2025"/);
  assert.match(source, /open\.spotify\.com\/embed\/playlist\/6hYj1RoYJ85hj8c1kaDFJ2/);
  assert.doesNotMatch(source, /appstore|youtube:|id: "about"/i);
});
