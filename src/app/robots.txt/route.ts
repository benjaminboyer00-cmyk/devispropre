import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { CANONICAL_PUBLIC_ORIGIN } from "@/lib/seo";

/** Généré à la demande — jamais figé au build (évite Sitemap .fr en cache). */
export const dynamic = "force-dynamic";

export async function GET() {
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
    `Sitemap: ${CANONICAL_PUBLIC_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
