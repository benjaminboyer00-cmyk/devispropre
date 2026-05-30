import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { getPublicSiteUrl } from "@/lib/seo";

/** Route explicite — fiable en Docker standalone (évite les bugs metadata robots.ts). */
export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const siteUrl = getPublicSiteUrl();

  const body = [
    "User-Agent: *",
    "Allow: /",
    "Disallow: /dashboard/",
    "Disallow: /api/",
    "Disallow: /api/public/",
    `Disallow: ${ROUTES.connexion}`,
    "Disallow: /devis/",
    "Disallow: /facture/",
    `Disallow: ${ROUTES.offline}`,
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
