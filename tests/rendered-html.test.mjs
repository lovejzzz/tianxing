import assert from "node:assert/strict";
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
  assert.match(html, /EduTool/);
  assert.match(html, /Slotronome/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("renders a project detail route", async () => {
  const response = await render("/projects/surge-method/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Push\. Recover\. Come back stronger\./);
  assert.match(html, /View on the App Store/);
});
