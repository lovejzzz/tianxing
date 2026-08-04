import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /Tian Xing/);
  assert.match(html, /Selected Work/);
  assert.match(html, /delivers\./i);
  assert.match(html, /EduTool/);
  assert.match(html, /Slotronome/);
  assert.doesNotMatch(html, /Choose an icon to open a project|Nine things I care about|makes things/i);
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
  assert.match(source, /toLocaleTimeString/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /Go to iPhone Home screen/);
  assert.match(source, /Selected Work/);
  assert.match(source, /media\/about\/tian-xing\.jpg/);
});
