"use client";

import { useReportWebVitals } from "next/web-vitals";
import { analyticsEnabled, trackEvent } from "@/lib/analytics";

/** Web Vitals → fournisseur analytics actif (Plausible ou PostHog). Pas d'API interne. */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production" || !analyticsEnabled()) return;

    trackEvent("Web Vital", {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating ?? "unknown",
    });
  });

  return null;
}
