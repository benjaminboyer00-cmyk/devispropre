"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics";

/** Remonte CLS, LCP, INP — beacon interne + Plausible/PostHog. */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return;

    const payload = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      id: metric.id,
      path: typeof window !== "undefined" ? window.location.pathname : "",
    });

    trackEvent("Web Vital", {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/vitals", payload);
      return;
    }

    fetch("/api/analytics/vitals", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  });

  return null;
}
