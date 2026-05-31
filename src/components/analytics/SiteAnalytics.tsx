"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCookieConsent } from "@/components/consent/CookieConsentContext";
import { primaryAnalyticsProvider, googleAnalyticsEnabled } from "@/lib/analytics";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { WebVitals } from "@/components/analytics/WebVitals";

/** Analytics actifs uniquement après consentement cookies. */
export function SiteAnalytics({ children }: { children: React.ReactNode }) {
  const { analyticsAllowed } = useCookieConsent();
  const provider = primaryAnalyticsProvider();
  const measure = analyticsAllowed && (provider !== null || googleAnalyticsEnabled());

  const body = (
    <>
      {children}
      {measure && <WebVitals />}
      {analyticsAllowed && provider === "vercel" && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );

  if (analyticsAllowed && provider === "posthog") {
    return <PostHogProvider>{body}</PostHogProvider>;
  }

  return body;
}
