import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_FOR_PAGES ? "export" : undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
