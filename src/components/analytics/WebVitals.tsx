"use client";

import { useReportWebVitals } from "next/web-vitals";

/** Mesure CLS, LCP, INP en production (console debug — brancher analytics ici). */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "production") {
      console.debug(`[web-vitals] ${metric.name}`, Math.round(metric.value), metric.rating);
    }
  });

  return null;
}
