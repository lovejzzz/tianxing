#!/usr/bin/env python3
"""Small no-focus Chrome regression harness for the Weather cinema experience."""

from __future__ import annotations

import argparse
import base64
import json
import pathlib
import time
import urllib.parse
import queue
import threading

import requests
from websockets.sync.client import connect


class CDP:
    def __init__(self, websocket_url: str):
        self.socket = connect(websocket_url, origin="http://localhost", max_size=None)
        self.request_id = 0
        self.responses: queue.Queue[dict] = queue.Queue()
        self.reader = threading.Thread(target=self._read, daemon=True)
        self.reader.start()

    def _read(self):
        try:
            while True:
                self.responses.put(json.loads(self.socket.recv()))
        except Exception:
            return

    def call(self, method: str, params: dict | None = None):
        self.request_id += 1
        request_id = self.request_id
        self.socket.send(json.dumps({"id": request_id, "method": method, "params": params or {}}))
        while True:
            message = self.responses.get(timeout=30)
            if message.get("id") != request_id:
                continue
            if "error" in message:
                raise RuntimeError(f"{method}: {message['error']}")
            return message.get("result", {})

    def close(self):
        self.socket.close()


def evaluate(cdp: CDP, expression: str):
    result = cdp.call(
        "Runtime.evaluate",
        {"expression": expression, "returnByValue": True, "awaitPromise": True},
    )
    return result.get("result", {}).get("value")


def run_case(port: int, output_dir: pathlib.Path, case: dict):
    url = case["url"]
    parsed = urllib.parse.urlsplit(url)
    host_url = f"http://127.0.0.1:{parsed.port or 80}{parsed.path}"
    if parsed.query:
        host_url += f"?{parsed.query}"
    target = requests.put(
        f"http://127.0.0.1:{port}/json/new?{urllib.parse.quote(url, safe=':/?=&-')}"
    ).json()
    cdp = CDP(target["webSocketDebuggerUrl"])
    try:
        width, height = case["viewport"]
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")
        cdp.call(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": height,
                "deviceScaleFactor": case.get("dpr", 1),
                "mobile": case.get("mobile", False),
                "screenWidth": width,
                "screenHeight": height,
            },
        )
        cdp.call("Page.navigate", {"url": host_url})
        deadline = time.time() + 20
        while time.time() < deadline:
            ready = evaluate(cdp, "document.readyState")
            renderer = evaluate(cdp, "document.querySelector('[data-weather-renderer]')?.dataset.weatherRenderer || ''")
            if ready == "complete" and (renderer or not case.get("weather")):
                break
            time.sleep(0.15)
        time.sleep(case.get("settle", 2.0))
        if case.get("open_picker"):
            evaluate(cdp, "document.querySelector('.weather-city-chip')?.click()")
            time.sleep(0.35)

        audit = evaluate(
            cdp,
            """(() => {
              const q = (s) => document.querySelector(s);
              const r = q('[data-weather-renderer]');
              const activeVideo = q('.weather-cinema-video-layer.is-active');
              const phone = q('.phone-product');
              const screen = q('.screen');
              const chip = q('.weather-city-chip');
              const visible = (el) => !!el && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
              const overflow = [...document.querySelectorAll('body *')].filter((el) => {
                const b = el.getBoundingClientRect();
                return visible(el) && (b.right > innerWidth + 2 || b.left < -2);
              }).slice(0, 12).map((el) => ({tag:el.tagName, cls:el.className, box:[Math.round(el.getBoundingClientRect().left),Math.round(el.getBoundingClientRect().right)]}));
              const box = (el) => el ? Object.fromEntries(['left','top','right','bottom','width','height'].map((k) => [k, Math.round(el.getBoundingClientRect()[k] * 10) / 10])) : null;
              return {
                viewport:[innerWidth,innerHeight],
                renderer:r?.dataset.weatherRenderer || null,
                fallback:r?.dataset.weatherFallback || null,
                weather:r?.dataset.weather || null,
                light:r?.dataset.light || null,
                ready:r?.dataset.ready || null,
                video:activeVideo?.getAttribute('src') || null,
                videoReady:activeVideo?.readyState ?? null,
                chip:chip?.innerText || null,
                phone:box(phone), screen:box(screen),
                appIcons:[...document.querySelectorAll('.system-app-icon')].filter(visible).length,
                featuredCities:[...document.querySelectorAll('.weather-featured-city')].filter(visible).length,
                citySearch:visible(q('.weather-picker input[aria-label="Search city"]')),
                overflow
              };
            })()""",
        )
        shot = cdp.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / f"{case['name']}.png").write_bytes(base64.b64decode(shot["data"]))
        (output_dir / f"{case['name']}.json").write_text(json.dumps(audit, indent=2))
        return audit
    finally:
        cdp.close()
        requests.get(f"http://127.0.0.1:{port}/json/close/{target['id']}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=9228)
    parser.add_argument("--site", default="http://localhost:3011")
    parser.add_argument("--output", default="production/weather-cinema/qa/browser-regression")
    args = parser.parse_args()
    cases = [
        {"name": "desktop-rome-fog-day", "url": f"{args.site}/?regressionTest=weather&weatherTest=fog&weatherCity=rome&weatherHour=12", "viewport": (1440, 900), "weather": True, "open_picker": True},
        {"name": "desktop-rome-fog-night", "url": f"{args.site}/?regressionTest=weather&weatherTest=fog&weatherCity=rome&weatherHour=22", "viewport": (1440, 900), "weather": True},
        {"name": "mobile-rome-fog-night", "url": f"{args.site}/?regressionTest=weather&weatherTest=fog&weatherCity=rome&weatherHour=22", "viewport": (390, 844), "dpr": 2, "mobile": True, "weather": True},
        {"name": "desktop-sydney-fallback", "url": f"{args.site}/?regressionTest=weather&weatherTest=rain&weatherCity=sydney&weatherHour=12", "viewport": (1440, 900), "weather": True},
        {"name": "narrow-desktop-home", "url": f"{args.site}/", "viewport": (540, 900), "settle": 3},
    ]
    results = {}
    for case in cases:
        results[case["name"]] = run_case(args.port, pathlib.Path(args.output), case)
        print(case["name"], json.dumps(results[case["name"]], separators=(",", ":")))

    failures = []
    for name in ("desktop-rome-fog-day", "desktop-rome-fog-night", "mobile-rome-fog-night"):
        result = results[name]
        if result["renderer"] != "cinematic-video" or "rome-foggy" not in (result["video"] or ""):
            failures.append(f"{name}: curated Rome video did not render")
        if result["ready"] != "true" or (result["videoReady"] or 0) < 2:
            failures.append(f"{name}: curated video did not become ready")
    fallback = results["desktop-sydney-fallback"]
    if fallback["renderer"] != "procedural" or fallback["fallback"] != "global-city":
        failures.append("Sydney: global-city procedural fallback did not render")
    if results["narrow-desktop-home"]["appIcons"] < 8:
        failures.append("Narrow desktop: app icons disappeared")
    if results["desktop-rome-fog-day"]["featuredCities"] != 10 or not results["desktop-rome-fog-day"]["citySearch"]:
        failures.append("Weather picker: expected ten curated city choices plus search")
    if failures:
        raise SystemExit("\n".join(failures))


if __name__ == "__main__":
    main()
