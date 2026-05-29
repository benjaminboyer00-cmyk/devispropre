import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
import { getPublicSiteUrl } from "@/lib/seo";

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
