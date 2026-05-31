"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ANALYTICS, pushDataLayer } from "@/lib/analytics";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";

/** Envoie les changements de page SPA vers GTM / GA4 (dataLayer). */
export function GtmPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ANALYTICS.gtmId && !ANALYTICS.gaMeasurementId) return;
    if (!hasAnalyticsConsent()) return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    pushDataLayer({
      event: "page_view",
      page_path: pagePath,
      page_location: typeof window !== "undefined" ? window.location.href : pagePath,
    });
  }, [pathname, searchParams]);

  return null;
}
