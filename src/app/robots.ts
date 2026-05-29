import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
import { getPublicSiteUrl } from "@/lib/seo";

/** Régénéré à chaque requête — lit NEXT_PUBLIC_APP_URL du .env.production (pas figé au build). */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/api/",
        "/api/public/",
        ROUTES.connexion,
        "/devis/",
        "/facture/",
        ROUTES.offline,
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
