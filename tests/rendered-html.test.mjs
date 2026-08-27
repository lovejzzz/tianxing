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
  const introGuard = html.indexOf("html.phone-intro-pending{background:#020305!important}");
  const phoneMarkup = html.indexOf('class="phone-product"');
  assert.ok(introGuard >= 0 && phoneMarkup > introGuard, "the pre-paint dark-field guard must arrive before the phone markup");
  assert.match(html, /<html[^>]*class="phone-intro-pending"[^>]*data-phone-intro="pending"/);
  assert.match(html, /html\.phone-intro-pending::before\{content:'';position:fixed;z-index:2147483647;inset:0;background:#020305\}/);
  assert.match(html, /html\.phone-intro-pending body\{visibility:hidden!important\}/);
  assert.doesNotMatch(html, /dataset\.phoneIntro = 'pending'/);
  assert.doesNotMatch(html, /classList\.add\('phone-intro-pending'\)/);
  assert.match(html, /if \(!isHome \|\| !desktopIntro\)/);
  assert.match(html, /window\.location\.pathname/);
  assert.doesNotMatch(html, /tian-phone-intro-played/);
  assert.doesNotMatch(html, /Portfolio · Edition 01|Selected work|2024—2026|Tian Xing delivers|Designed &amp; built by Tian Xing|New York/i);
  assert.doesNotMatch(html, /Choose an icon to open a project|Nine things I care about|makes things|systems thinking and play/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("renders a project detail route", async () => {
  const response = await render("/projects/surge-method");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Push\. Recover\. Come back stronger\./);
  assert.match(html, /View on the App Store/);
  assert.match(html, /class="store-button"[\s\S]{0,500}class="app-icon icon-surge-method/);
  assert.doesNotMatch(html, /VIEW PROJECT/);
  assert.doesNotMatch(html, /app-icon-large/);
  assert.match(html, /class="project-hero-visual project-hero-contain"/);
  assert.match(html, /main-hi\.png/);
  assert.match(html, /Behind the work/);
  assert.match(html, /Designed, built, and shipped solo/);
  assert.match(html, /Released on the Apple App Store/);
});

test("shows the current EduTool generation workspace and Scion model", async () => {
  const response = await render("/projects/edutool");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /edutool-generation\.png/);
  assert.match(html, /Meet Scion/);
  assert.match(html, /Brief-anchored/);
  assert.match(html, /Evidence-honest/);
  assert.match(html, /Key decisions/);
  assert.match(html, /What I built/);
  assert.match(html, /One canonical model/);
  assert.match(html, /Live at edutool\.dev/);
  assert.match(html, /edutool-live\.png/);
  assert.match(html, /property="og:image" content="https:\/\/tian\.fun\/media\/projects\/edutool-live\.png"/);
});

test("embeds playable projects and full-resolution screenshots", async () => {
  const response = await render("/projects/bebop-puzzle");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Play Bebop Puzzle here/);
  assert.match(html, /https:\/\/beboppuzzle\.com/);
  assert.match(html, /youtube-nocookie\.com\/embed\/uRz4HQILA_c/);
  assert.match(html, /bebop-live\.png/);
  assert.match(html, /class="project-hero-visual/);
  assert.match(html, /Limits &amp; misses/);
  assert.match(html, /80 levels/);
  assert.match(html, /Live at beboppuzzle\.com/);
  assert.ok(
    html.indexOf("youtube-nocookie.com/embed/uRz4HQILA_c") < html.indexOf("LIVE DEMO"),
    "the project video should introduce Bebop Puzzle before the playable embed",
  );
  assert.ok(
    html.indexOf("What it does") < html.indexOf("CASE STUDY"),
    "the visual project story should appear before the long-form case study",
  );
  assert.equal((html.match(/bebop-live\.png/g) ?? []).length >= 1, true);
  assert.equal((html.match(/FULL RESOLUTION/g) ?? []).length, 0, "the hero screenshot should not repeat in the gallery");
});

test("reserves flagship case-study evidence for the three lead projects", async () => {
  const flagshipPaths = ["/projects/edutool", "/projects/surge-method", "/projects/bebop-puzzle"];
  for (const path of flagshipPaths) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /CASE STUDY/);
    assert.match(html, /The problem/);
    assert.match(html, /Exact role/);
    assert.match(html, />Team</);
    assert.match(html, />Results</);
  }

  const nonFlagship = await render("/projects/quicky-resume");
  assert.equal(nonFlagship.status, 200);
  assert.doesNotMatch(await nonFlagship.text(), /CASE STUDY/);
});

test("features the latest Here We Go Film Studio release", async () => {
  const response = await render("/projects/here-we-go-film-studio");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /NEW RELEASE/);
  assert.match(html, /Reference Image/);
  assert.match(html, /Made with Seedance 2\.5\./);
  assert.match(html, /youtube-nocookie\.com\/embed\/509K8N368mg/);
  assert.match(html, /youtube\.com\/watch\?v=509K8N368mg/);
  assert.ok(html.indexOf("Reference Image") < html.indexOf("What it does"));
});

test("keeps the iPhone interactive and time-aware", async () => {
  const source = await readFile(new URL("../app/components/PhoneExperience.tsx", import.meta.url), "utf8");
  const weatherEngineSource = await readFile(new URL("../app/components/WeatherCinemaEngine.tsx", import.meta.url), "utf8");
  const weatherVideoSource = await readFile(new URL("../app/components/WeatherCinemaVideo.tsx", import.meta.url), "utf8");
  const weatherCinemaDataSource = await readFile(new URL("../app/data/weatherCinema.ts", import.meta.url), "utf8");
  const phone3dSource = await readFile(new URL("../app/components/Phone3DIntro.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const photoManifest = await readFile(new URL("../app/photoManifest.ts", import.meta.url), "utf8");
  const projectSource = await readFile(new URL("../app/projects.ts", import.meta.url), "utf8");
  const soundSource = await readFile(new URL("../app/sound.ts", import.meta.url), "utf8");
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
  assert.match(styles, /\.notes-app\.notes-studio::before\{display:none\}/);
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
  assert.match(source, /Hi, I’m Tian\. Nice to meet you\./);
  assert.match(source, /placeholder="Message"/);
  assert.match(source, /Message sent\./);
  assert.match(source, /Try Again/);
  assert.doesNotMatch(source, /HEART EXCHANGE|message-capsule-app|Turn the dial/);
  assert.doesNotMatch(styles, /message-secret-door|machine-secret-reveal|capsule-machine/);
  assert.match(source, /enterKeyHint="send"/);
  assert.doesNotMatch(source, /Delivered ✓/);
  assert.match(source, /Photo Booth effects/);
  assert.match(source, /photo-viewer/);
  assert.match(source, /WeatherCinemaVideo/);
  assert.match(weatherVideoSource, /WeatherCinemaEngine/);
  assert.match(weatherVideoSource, /CROSSFADE_MS/);
  assert.match(weatherVideoSource, /weather-cinema-video-layer/);
  assert.match(weatherVideoSource, /visibilitychange/);
  assert.match(weatherVideoSource, /HAVE_CURRENT_DATA/);
  assert.match(weatherVideoSource, /onUnavailable/);
  assert.match(weatherVideoSource, /data-weather-renderer="procedural"/);
  assert.match(weatherVideoSource, /data-weather-fallback=\{asset \? \(videoUnavailable \? "video-error" : "curated-video-pending"\) : "global-city"\}/);
  assert.match(weatherVideoSource, /<WeatherCinemaEngine code=\{code\} isDay=\{isDay\} place=\{place\}/);
  assert.doesNotMatch(weatherVideoSource, /weather-cinema-fallback[\s\S]{0,520}<img src=\{asset\?\.poster\}/);
  assert.match(weatherVideoSource, /data-weather-renderer="cinematic-video"/);
  assert.match(weatherCinemaDataSource, /if \(!city\) return null/);
  assert.match(weatherCinemaDataSource, /names\.includes\(normalized\)/);
  assert.match(weatherEngineSource, /cityLandmark/);
  assert.match(weatherEngineSource, /sceneLighting/);
  assert.match(weatherEngineSource, /prepareApertureMask/);
  assert.match(weatherEngineSource, /drawInteriorLightField/);
  assert.match(weatherEngineSource, /kind === "cloud"/);
  assert.match(weatherEngineSource, /directStrength/);
  assert.match(weatherEngineSource, /ambientStrength/);
  assert.match(weatherEngineSource, /roomShade/);
  assert.match(weatherEngineSource, /roomCanvas/);
  assert.match(weatherEngineSource, /globalCompositeOperation = "source-atop"/);
  assert.match(weatherEngineSource, /drawGlassResponse/);
  assert.match(weatherEngineSource, /drawWindowRain/);
  assert.match(weatherEngineSource, /drawRainField/);
  assert.match(weatherEngineSource, /stickSlip/);
  assert.match(weatherEngineSource, /sceneContext\.drawImage/);
  assert.match(weatherEngineSource, /lighting\.sourceColor/);
  assert.match(weatherEngineSource, /trickleRate/);
  assert.match(weatherEngineSource, /drawUnifiedGrade/);
  assert.doesNotMatch(weatherEngineSource, /drawInteriorLightResponse/);
  assert.match(weatherEngineSource, /drawWeather/);
  assert.match(weatherEngineSource, /requestAnimationFrame/);
  assert.match(weatherEngineSource, /roomAssetForProfile/);
  assert.match(weatherEngineSource, /skylinePresetForPlace/);
  assert.match(weatherEngineSource, /drawSkylinePlate/);
  assert.doesNotMatch(weatherEngineSource, /plateY - 17/);
  assert.match(weatherEngineSource, /measureAlphaBounds/);
  assert.match(weatherEngineSource, /skylineBoundsCache/);
  assert.match(weatherEngineSource, /512 \/ Math\.max\(width, height\)/);
  assert.match(weatherEngineSource, /pixels\[\(y \* sampleWidth \+ x\) \* 4 \+ 3\]/);
  assert.match(weatherEngineSource, /source\.x, source\.y, source\.width, source\.height/);
  assert.match(weatherEngineSource, /drawWorldSurface/);
  assert.match(weatherEngineSource, /drawAtmosphereBands/);
  assert.doesNotMatch(weatherEngineSource, /function drawCloud/);
  assert.match(weatherEngineSource, /smoothstep\(0, 1, clamp\(flashRaw\)\)/);
  assert.doesNotMatch(source, /--weather-rx|--weather-ry/);
  assert.doesNotMatch(weatherEngineSource, /tiltRef|liveTilt|tiltX/);
  assert.doesNotMatch(styles, /weather-picker-open>\.weather-engine-stage\{[^}]*transform:/);
  assert.match(styles, /weather-cinema-canvas/);
  assert.match(styles, /weather-engine-stage/);
  assert.match(source, /Cinematic Cities/);
  assert.match(source, /Ten windows/);
  assert.match(source, /weather-featured-grid/);
  for (const city of ["New York", "Los Angeles", "San Francisco", "Chicago", "Toronto", "Mexico City", "Rio de Janeiro", "London", "Paris", "Rome"]) assert.match(weatherCinemaDataSource, new RegExp(city));
  await Promise.all([
    "studio",
    "hotel",
    "observatory",
  ].map((room) => access(new URL(`../public/media/weather/engine/room-${room}-v1.webp`, import.meta.url))));
  await Promise.all([
    "metropolis",
    "heritage",
    "waterfront",
  ].map((skyline) => access(new URL(`../public/media/weather/engine/skyline/${skyline}-v2.webp`, import.meta.url))));
  assert.match(source, /geocoding-api\.open-meteo\.com/);
  assert.match(source, /weather-city-chip/);
  assert.match(source, /Finding the sky…/);
  assert.match(source, /WEATHER_CACHE_KEY/);
  assert.match(source, /precipitation_probability/);
  assert.doesNotMatch(source, /7-DAY FORECAST|SUNRISE & SUNSET|Switch to degrees/);
  assert.match(source, /Dragon egg timer/);
  assert.match(source, /endTimeRef/);
  assert.match(source, /Reset timer/);
  assert.match(source, /role="slider"/);
  assert.match(source, /has hatched/);
  // Every cue is synthesized in one shared engine, so the phone has a single
  // voice and a single switch that silences it.
  assert.match(soundSource, /AudioContext/);
  assert.match(soundSource, /export function playSound/);
  assert.match(soundSource, /export function toggleRinger/);
  assert.match(soundSource, /tian-iphone-ringer/);
  assert.doesNotMatch(soundSource, /\.mp3|\.wav|\.m4a|\.aac|decodeAudioData/);
  assert.doesNotMatch(source, /new AudioContextClass|createOscillator/);
  assert.match(source, /playSound\("shutter"\)/);
  assert.match(source, /playSound\("send"\)/);
  assert.match(source, /playSound\("chime"\)/);
  assert.match(source, /function playKeyboardTick/);
  assert.match(source, /status-ringer/);
  assert.match(source, /ringer-hud/);
  assert.match(styles, /\.ringer-switch\.is-silent/);
  assert.match(styles, /@keyframes ringer-hud-card/);
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
  assert.match(styles, /fun-portal-open/);
  assert.match(source, /fun-icon-shell/);
  assert.match(source, /function FunShelf/);
  assert.match(source, /projects\.slice\(0, 9\)\.map/);
  assert.match(source, /--launch-scale-x/);
  assert.match(source, /--launch-width/);
  assert.match(source, /data-app-id=\{app\.id\}/);
  assert.match(source, /shouldReturnToFunIcon/);
  assert.match(source, /className="phone-product"/);
  assert.match(source, /className="status-time"/);
  assert.match(source, /className="phone-back"/);
  assert.match(source, /<Phone3DIntro productRef=\{phoneProductRef\} \/>/);
  assert.match(source, /ref=\{phoneProductRef\}/);
  assert.match(phone3dSource, /zero-depth rounded glass face/i);
  assert.match(phone3dSource, /function withoutInwardFaces/);
  assert.match(phone3dSource, /const bandGeometry = withoutInwardFaces\(rawBandGeometry\)/);
  assert.match(phone3dSource, /pointsInward/);
  assert.match(phone3dSource, /function machinedButtonGeometry/);
  assert.match(phone3dSource, /new THREE\.LatheGeometry/);
  assert.match(phone3dSource, /homeButtonGroup\.position\.z = -0\.0065 \* homeButtonDepth/);
  assert.doesNotMatch(phone3dSource, /const pressedScale/);
  assert.match(phone3dSource, /const homeSeamMaterial = new THREE\.MeshBasicMaterial/);
  assert.match(phone3dSource, /const homeCapMaterial = new THREE\.MeshBasicMaterial/);
  assert.match(phone3dSource, /const homeGlyphMaterial = new THREE\.MeshBasicMaterial/);
  assert.doesNotMatch(phone3dSource, /homeCapMaterial\.(?:roughness|clearcoatRoughness|envMapIntensity)\s*=/);
  assert.doesNotMatch(phone3dSource, /homeGlyphMaterial\.(?:roughness|color)\s*=/);
  assert.doesNotMatch(phone3dSource, /const glyphMetal/);
  assert.match(styles, /translateY\(\.45px\) scale\(\.996\)/);
  assert.match(soundSource, /hiss\(\{ from: 1350, to: 620/);
  assert.match(phone3dSource, /bevelSegments: 10/);
  assert.match(phone3dSource, /anisotropy: 0\.58/);
  assert.match(phone3dSource, /toneMappingExposure = 0\.86/);
  assert.doesNotMatch(phone3dSource, /const polishedSteel/);
  assert.doesNotMatch(phone3dSource, /frontChamfer|rearChamfer/);
  assert.doesNotMatch(phone3dSource, /clearcoat: 0\.32/);
  assert.doesNotMatch(phone3dSource, /displayGasket|gasketGeometry|linerGeometry/);
  // The rotating model and the resting phone now share the live DOM screen.
  // This removes the old canvas-texture crossfade (and its one-frame wallpaper/icon jump).
  assert.doesNotMatch(phone3dSource, /createIntroScreenTexture/);
  assert.doesNotMatch(phone3dSource, /introDisplayMaterial/);
  assert.doesNotMatch(phone3dSource, /domHandoff/);
  assert.match(phone3dSource, /product\.style\.visibility = "visible"/);
  assert.match(phone3dSource, /DOM front has backface-visibility:hidden/);
  assert.match(phone3dSource, /new THREE\.ShapeGeometry\(faceShape/);
  assert.match(phone3dSource, /faceShape\.holes/);
  assert.match(phone3dSource, /SCREEN_COMPOSITE_Z = GLASS_Z \+ 0\.004/);
  assert.match(phone3dSource, /new THREE\.MeshBasicMaterial\(\{ color: 0x010203 \}\)/);
  assert.match(phone3dSource, /const backSubstrate = new THREE\.MeshBasicMaterial/);
  assert.match(phone3dSource, /const backCoverGlass = new THREE\.MeshPhysicalMaterial/);
  assert.match(phone3dSource, /ior: 1\.52/);
  assert.match(phone3dSource, /FUJI_CASE_ART/);
  assert.match(phone3dSource, /const frostedCaseMaterial = new THREE\.MeshPhysicalMaterial/);
  assert.match(phone3dSource, /function traceRoundedRectAt/);
  assert.match(phone3dSource, /const cameraCutout = traceRoundedRectAt/);
  assert.match(phone3dSource, /const rearCameraBezel = new THREE\.MeshPhysicalMaterial/);
  assert.match(phone3dSource, /new THREE\.TorusGeometry\(0\.126, 0\.018/);
  assert.doesNotMatch(phone3dSource, /cameraCutout\.absellipse/);
  assert.match(phone3dSource, /let caseTextureReady = !showFujiCase/);
  assert.match(phone3dSource, /if \(!modelActive \|\| introStarted \|\| !caseTextureReady\) return/);
  assert.match(phone3dSource, /startedAt = performance\.now\(\)/);
  assert.match(phone3dSource, /revealFrame = window\.requestAnimationFrame\(\(\) => \{[\s\S]*?renderer\.render\(scene, camera\);[\s\S]*?document\.documentElement\.classList\.remove\("phone-intro-pending"\)/);
  assert.match(phone3dSource, /window\.cancelAnimationFrame\(revealFrame\)/);
  assert.match(phone3dSource, /\/media\/cases\/red-fuji-case\.jpg/);
  assert.doesNotMatch(phone3dSource, /file\.nbfox\.com/);
  assert.match(phone3dSource, /product\.style\.transform/);
  assert.match(phone3dSource, /introRequestedForDocument/);
  assert.match(phone3dSource, /delete document\.documentElement\.dataset\.phoneIntro/);
  assert.doesNotMatch(phone3dSource, /sessionStorage/);
  assert.doesNotMatch(phone3dSource, /host\.style\.visibility = "hidden"/);
  assert.match(source, /folder-portal-body/);
  assert.match(source, /--launch-body-scale-y/);
  assert.match(styles, /fun-body-shared-close/);
  assert.match(styles, /fun-chrome-stay-close/);
  assert.match(styles, /\.fun-icon-shell\{[\s\S]*?inset:auto;[\s\S]*?left:var\(--launch-x\);[\s\S]*?top:var\(--launch-y\)/);
  assert.doesNotMatch(source, /phone-edge edge-left/);
  assert.doesNotMatch(source, /phone-spine/);
  assert.doesNotMatch(styles, /@keyframes phone-product-flip/);
  assert.match(styles, /phone-3d-ready:not\(\.phone-3d-complete\) \.phone-product/);
  assert.match(styles, /phone-product>\.phone:has\(\.screen\.phone-mode-folder\)/);
  assert.match(styles, /water-drops\.png/);
  assert.match(styles, /transform:scale\(1\.035,1\.012\)/);
  assert.match(styles, /phone-3d-ready \.phone-product \.status-bar[\s\S]*padding-inline:13px/);
  assert.match(styles, /\.status-time\s*\{[^}]*left:50%[^}]*translate\(-50%,-50%\)/);
  assert.doesNotMatch(styles, /@keyframes phone-dom-handoff/);
  assert.doesNotMatch(styles, /\.edge-left/);
  assert.doesNotMatch(styles, /@keyframes phone-spine-reveal/);
  assert.doesNotMatch(source, /className="back-mark"/);
  assert.match(styles, /animation:fun-portal-open 920ms/);
  assert.match(styles, /animation:fun-icon-arrive 490ms calc\(300ms/);
  assert.match(styles, /@keyframes fun-content-dolly-open/);
  assert.match(styles, /@keyframes fun-page-home-close/);
  assert.match(styles, /transform:translate3d\(var\(--launch-x\),var\(--launch-y\),0\) scale\(var\(--launch-scale-x\),var\(--launch-scale-y\)\)/);
  assert.match(styles, /@keyframes fun-content-close \{ 0%,28%\{opacity:1/);
  assert.match(styles, /@keyframes fun-portal-close/);
  assert.match(styles, /sys-folder \.fun-shelf\.is-compact/);
  assert.doesNotMatch(source, />TX</);
  assert.match(styles, /phone-app-layer\.is-opening\.is-from-icon/);
  assert.match(styles, /backface-visibility:hidden/);
  assert.match(styles, /device-stage\.is-immersive\{translate:none/);
  assert.match(styles, /@media \(max-width:560px\) and \(hover:hover\) and \(pointer:fine\)[\s\S]*?phone-app-layer\.is-fun-app:not\(\.is-from-icon\)[\s\S]*?visibility:visible/);
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
  assert.match(source, /THE WILD WEB/);
  assert.match(source, /SAFARI_STAMPS_KEY/);
  assert.match(source, /startExpedition/);
  assert.match(source, /safari-passport/);
  assert.match(source, /safari-starfield/);
  assert.match(source, /safari-compass-glass/);
  assert.doesNotMatch(source, /safari-basecamp/);
  assert.match(styles, /safari-compass/);
  assert.match(styles, /safari-signal-pulse/);
  assert.equal((source.match(/media\/ios4\/icons\//g) ?? []).length, 2);
  assert.doesNotMatch(source, /Photo Portfolio/);
  for (const icon of ["messages", "calendar", "photos", "camera", "weather", "clock", "notes", "phone", "mail", "safari", "music"]) {
    await access(new URL(`../public/media/ios4/icons/${icon}.png`, import.meta.url));
  }
  const safariIcon = await readFile(new URL("../public/media/ios4/icons/safari.png", import.meta.url));
  assert.equal(safariIcon.readUInt32BE(16), 512);
  assert.equal(safariIcon.readUInt32BE(20), 512);
  assert.match(projectSource, /slug: "edutool"[\s\S]{0,180}year: "2026"/);
  assert.match(projectSource, /slug: "start-where-you-are"[\s\S]{0,180}year: "2025"/);
  assert.match(projectSource, /slug: "texas-jack"[\s\S]{0,180}year: "2024"/);
  assert.match(projectSource, /slug: "slotronome"[\s\S]{0,180}year: "2025"/);
  assert.match(source, /open\.spotify\.com\/embed\/playlist\/6hYj1RoYJ85hj8c1kaDFJ2/);
  assert.doesNotMatch(source, /appstore|youtube:|id: "about"/i);
});

test("keeps the weather-cinema production catalog internally consistent", async () => {
  const masters = JSON.parse(await readFile(new URL("../production/weather-cinema/masters.json", import.meta.url), "utf8"));
  const videos = JSON.parse(await readFile(new URL("../production/weather-cinema/videos.json", import.meta.url), "utf8"));
  const dataSource = await readFile(new URL("../app/data/weatherCinema.ts", import.meta.url), "utf8");
  const catalogSource = await readFile(new URL("../production/weather-cinema/catalog.mjs", import.meta.url), "utf8");
  const expectedStates = new Set(["sunny:day", "sunny:night", "rainy:day", "rainy:night", "snowy:day", "snowy:night", "foggy:day", "foggy:night"]);
  const curatedCities = ["new-york", "los-angeles", "san-francisco", "chicago", "toronto", "mexico-city", "rio-de-janeiro", "london", "paris", "rome"];

  assert.equal(masters.items.length, 30);
  assert.equal(new Set(masters.items.map((item) => item.slug)).size, 30);
  for (const master of masters.items) {
    assert.match(master.url, /^https:\/\//);
  }
  assert.equal((dataSource.match(/slug: "/g) ?? []).length, 10);
  for (const slug of curatedCities) {
    assert.ok(masters.items.some((master) => master.slug === slug));
    assert.match(dataSource, new RegExp(`slug: "${slug}"`));
    assert.ok(catalogSource.includes(`["${slug}"`));
  }

  const accepted = videos.items.filter((item) => item.qa === "accepted");
  const acceptedKeys = accepted.map((item) => `${item.city}:${item.weather}:${item.light}`);
  assert.equal(new Set(acceptedKeys).size, acceptedKeys.length);
  assert.equal(new Set(accepted.map((item) => item.url)).size, accepted.length);
  for (const item of videos.items) {
    assert.ok(expectedStates.has(`${item.weather}:${item.light}`));
    assert.ok(masters.items.some((master) => master.slug === item.city));
    assert.match(item.url, /^(https:\/\/|\/media\/weather\/cinema\/)/);
    if (item.url.startsWith("/media/weather/cinema/")) {
      await access(new URL(`../public${item.url}`, import.meta.url));
    }
    assert.ok(["accepted", "candidate", "rejected"].includes(item.qa));
  }
});
