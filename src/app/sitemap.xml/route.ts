import { NextResponse } from "next/server";
import { buildSitemapEntries, renderSitemapXml } from "@/lib/sitemap-data";

/** Route explicite — fiable en Docker standalone (évite les bugs metadata sitemap.ts). */
export const dynamic = "force-dynamic";

export async function GET() {
  const xml = renderSitemapXml(buildSitemapEntries());

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
