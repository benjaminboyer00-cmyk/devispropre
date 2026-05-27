import type { MetadataRoute } from "next";
import { getAllLocalSeoPaths, sitemapLastModifiedForPath } from "@/lib/local-seo";
import { MARKETING_ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const priorities: Record<string, number> = {
    "/": 1,
    "/tarifs": 0.9,
    "/conformite": 0.85,
    "/guide/devis-artisan-conforme": 0.8,
    "/guide/facturation-auto-entrepreneur": 0.75,
    "/guide/tva-artisan-travaux": 0.75,
    "/guide/mentions-obligatoires-devis": 0.75,
    "/guide/partager-devis-whatsapp": 0.75,
    "/inscription": 0.8,
  };

  const changeFreq = (path: string): MetadataRoute.Sitemap[number]["changeFrequency"] => {
    if (path === "/") return "weekly";
    if (path.startsWith("/devis-artisan/")) return "monthly";
    return "monthly";
  };

  const marketing = MARKETING_ROUTES.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: sitemapLastModifiedForPath(path),
    changeFrequency: changeFreq(path),
    priority: priorities[path] ?? 0.5,
  }));

  const local = getAllLocalSeoPaths().map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: sitemapLastModifiedForPath(path),
    changeFrequency: changeFreq(path) as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: path.split("/").length === 3 ? 0.75 : 0.65,
  }));

  return [...marketing, ...local];
}
