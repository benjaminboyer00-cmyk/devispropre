import type { MetadataRoute } from "next";
import { MARKETING_ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const priorities: Record<string, number> = {
    "/": 1,
    "/tarifs": 0.9,
    "/conformite": 0.85,
    "/inscription": 0.8,
  };

  const changeFreq = (path: string): MetadataRoute.Sitemap[number]["changeFrequency"] =>
    path === "/" ? "weekly" : "monthly";

  return MARKETING_ROUTES.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFreq(path),
    priority: priorities[path] ?? 0.5,
  }));
}
