import type { MetadataRoute } from "next";
import {
  getAllLocalSeoPaths,
  sitemapLastModifiedForPath,
} from "@/lib/local-seo";
import { MARKETING_ROUTES } from "@/lib/routes";
import { getPublicSiteUrl } from "@/lib/seo";

const MARKETING_PRIORITIES: Record<string, number> = {
  "/": 1,
  "/creer-devis": 0.92,
  "/tarifs": 0.9,
  "/conformite": 0.85,
  "/guide/devis-artisan-conforme": 0.8,
  "/guide/facturation-auto-entrepreneur": 0.75,
  "/guide/tva-artisan-travaux": 0.75,
  "/guide/mentions-obligatoires-devis": 0.75,
  "/guide/partager-devis-whatsapp": 0.75,
  "/blog": 0.78,
  "/blog/devis-plombier-chiffrage": 0.82,
  "/blog/facture-auto-entrepreneur-2026": 0.8,
  "/blog/devis-electricien-normes": 0.81,
  "/blog/relancer-devis-artisan": 0.79,
  "/devis-artisan": 0.82,
  "/inscription": 0.8,
};

function changeFreq(path: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (path === "/") return "weekly";
  if (path.startsWith("/devis-artisan/")) return "monthly";
  return "monthly";
}

function toEntry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${getPublicSiteUrl()}${path}`,
    lastModified: sitemapLastModifiedForPath(path),
    changeFrequency: changeFreq(path),
    priority,
  };
}

/** Sitemap unique — ~70 URLs (marketing + 6 métiers × 10 villes). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketing = MARKETING_ROUTES.map((path) =>
    toEntry(path, MARKETING_PRIORITIES[path] ?? 0.5)
  );

  const local = getAllLocalSeoPaths().map((path) =>
    toEntry(path, path.split("/").length === 3 ? 0.75 : 0.65)
  );

  return [...marketing, ...local];
}
