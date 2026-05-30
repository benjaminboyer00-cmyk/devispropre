import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { getPublicSiteUrl } from "@/lib/seo";

/** Toujours aligné sur le domaine réellement crawlé (évite un Sitemap .fr figé au build). */
export const dynamic = "force-dynamic";

function siteUrlFromRequest(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    const apex = host.split(",")[0]?.trim().replace(/^www\./i, "") ?? host;
    return `${proto}://${apex}`;
  }
  return getPublicSiteUrl();
}

export async function GET(request: Request) {
  const siteUrl = siteUrlFromRequest(request);

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
