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

  return pages.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
