"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { primaryAnalyticsProvider } from "@/lib/analytics";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { WebVitals } from "@/components/analytics/WebVitals";

/** Un seul stack analytics actif — voir primaryAnalyticsProvider() et .env.example. */
export function SiteAnalytics({ children }: { children: React.ReactNode }) {
  const provider = primaryAnalyticsProvider();

  const body = (
    <>
      {children}
      {provider && <WebVitals />}
      {provider === "vercel" && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );

  if (provider === "posthog") {
    return <PostHogProvider>{body}</PostHogProvider>;
  }

  return body;
}
