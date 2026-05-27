"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ANALYTICS } from "@/lib/analytics";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { WebVitals } from "@/components/analytics/WebVitals";

/** Stack analytics : Vercel (perf) + PostHog (UX) + Web Vitals custom. */
export function SiteAnalytics({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      {children}
      <WebVitals />
      {ANALYTICS.vercelInsights && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </PostHogProvider>
  );
}
