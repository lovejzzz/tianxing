import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tian Xing — Selected Work",
    short_name: "Tian",
    description: "Products, games, films, and creative tools by Tian Xing.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070a",
    theme_color: "#05070a",
    icons: [{ src: "/favicon.png", sizes: "128x128", type: "image/png" }],
  };
}
