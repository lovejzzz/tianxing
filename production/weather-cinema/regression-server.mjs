#!/usr/bin/env node

/**
 * Production regression shim.
 *
 * Vinext 0.0.50's local production server does not advertise MP4 MIME types
 * or byte ranges. Cloudflare/Sites does both. This tiny proxy serves the
 * built client directory with CDN-like headers and forwards application
 * requests to the real Vinext production server.
 */

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, request as proxyRequest } from "node:http";
import { extname, join, normalize } from "node:path";

const listenPort = Number(process.env.PORT || 3011);
const upstreamPort = Number(process.env.UPSTREAM_PORT || 3010);
const clientRoot = join(process.cwd(), "dist", "client");
const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4v": "video/x-m4v",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveStaticFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relative = normalize(decoded).replace(/^[/\\]+/, "");
  if (relative.startsWith("..")) return null;
  const file = join(clientRoot, relative);
  if (!file.startsWith(clientRoot) || !existsSync(file)) return null;
  const stats = statSync(file);
  return stats.isFile() ? { file, stats } : null;
}

function serveStatic(req, res, entry) {
  const size = entry.stats.size;
  const type = mimeTypes[extname(entry.file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Content-Type": type,
  };

  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      res.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      ...baseHeaders,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(entry.file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, { ...baseHeaders, "Content-Length": String(size) });
  if (req.method === "HEAD") return res.end();
  createReadStream(entry.file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const entry = resolveStaticFile(url.pathname);
  if (entry) return serveStatic(req, res, entry);

  const upstream = proxyRequest(
    {
      hostname: "127.0.0.1",
      port: upstreamPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    },
  );
  upstream.on("error", (error) => {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Regression upstream failed: ${error.message}`);
  });
  req.pipe(upstream);
}).listen(listenPort, "127.0.0.1", () => {
  console.log(`Weather regression server http://127.0.0.1:${listenPort} -> :${upstreamPort}`);
});
