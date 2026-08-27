import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_FOR_PAGES ? "export" : undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // GitHub Pages needs directory-style routes, but the Vinext/Sites server
  // must leave real public files alone (for example, `scene.mp4` rather than
  // redirecting it to the invalid `scene.mp4/`).
  trailingSlash: Boolean(process.env.BUILD_FOR_PAGES),
  images: { unoptimized: true },
  typescript: process.env.BUILD_FOR_PAGES
    ? { tsconfigPath: "tsconfig.pages.json" }
    : undefined,
};

export default nextConfig;
