import {
  getAllLocalSeoPaths,
  sitemapLastModifiedForPath,
} from "@/lib/local-seo";
import { MARKETING_ROUTES } from "@/lib/routes";
import { getPublicSiteUrl } from "@/lib/seo";

const MARKETING_PRIORITIES: Record<string, number> = {
  "/": 1,
  "/devis-facile": 0.94,
  "/guide/comment-faire-un-devis": 0.93,
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

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: "weekly" | "monthly";
  priority: number;
}

function changeFreq(path: string): "weekly" | "monthly" {
  if (path === "/") return "weekly";
  return "monthly";
}

export function buildSitemapEntries(): SitemapUrlEntry[] {
  const base = getPublicSiteUrl();

  const marketing = MARKETING_ROUTES.map((path) => ({
    loc: `${base}${path}`,
    lastmod: sitemapLastModifiedForPath(path).toISOString(),
    changefreq: changeFreq(path),
    priority: MARKETING_PRIORITIES[path] ?? 0.5,
  }));

  const local = getAllLocalSeoPaths().map((path) => ({
    loc: `${base}${path}`,
    lastmod: sitemapLastModifiedForPath(path).toISOString(),
    changefreq: "monthly" as const,
    priority: path.split("/").length === 3 ? 0.75 : 0.65,
  }));

  return [...marketing, ...local];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderSitemapXml(entries: SitemapUrlEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(2)}</priority>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
