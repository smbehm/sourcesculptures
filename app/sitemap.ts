import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}/`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];

  return entries;
}
