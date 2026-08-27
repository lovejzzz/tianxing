import type { MetadataRoute } from "next";
import { projects } from "./projects";

const origin = "https://tian.fun";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/about/`, changeFrequency: "monthly", priority: 0.7 },
    ...projects.map((project) => ({
      url: `${origin}/projects/${project.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
