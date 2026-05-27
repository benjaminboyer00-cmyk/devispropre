import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/tarifs",
    "/conformite",
    "/inscription",
    "/mentions-legales",
    "/politique-confidentialite",
    "/cgu",
    "/cgv",
  ];

  const priorities: Record<string, number> = {
    "": 1,
    "/tarifs": 0.9,
    "/conformite": 0.85,
    "/inscription": 0.8,
  };

  return pages.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
    priority: priorities[path] ?? 0.5,
  }));
}
