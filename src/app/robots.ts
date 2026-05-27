import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/api/",
        ROUTES.connexion,
        "/devis/",
        ROUTES.offline,
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
