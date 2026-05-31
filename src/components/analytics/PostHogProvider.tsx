"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useCookieConsent } from "@/components/consent/CookieConsentContext";
import { analyticsPageUrl } from "@/lib/analytics-path";
import { ANALYTICS, primaryAnalyticsProvider } from "@/lib/analytics";

function PostHogPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = usePostHog();

  useEffect(() => {
    if (!pathname || !client) return;
    const url = analyticsPageUrl(window.origin, pathname, searchParams?.toString() ?? "");
    if (!url) return;
    client.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, client]);

  return null;
}

/** PostHog — actif uniquement après consentement cookies. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { analyticsAllowed } = useCookieConsent();

  useEffect(() => {
    if (
      !analyticsAllowed ||
      process.env.NODE_ENV !== "production" ||
      primaryAnalyticsProvider() !== "posthog" ||
      !ANALYTICS.posthogKey ||
      posthog.__loaded
    ) {
      return;
    }

    posthog.init(ANALYTICS.posthogKey, {
      api_host: ANALYTICS.posthogHost,
      ui_host: ANALYTICS.posthogHost.includes("eu.")
        ? "https://eu.posthog.com"
        : "https://app.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-mask]",
      },
    });
  }, [analyticsAllowed]);

  if (!analyticsAllowed || primaryAnalyticsProvider() !== "posthog" || !ANALYTICS.posthogKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageViewInner />
      </Suspense>
      {children}
    </PHProvider>
  );
}
