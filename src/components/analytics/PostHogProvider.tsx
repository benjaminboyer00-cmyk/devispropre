"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { analyticsPageUrl } from "@/lib/analytics-path";
import { ANALYTICS, primaryAnalyticsProvider } from "@/lib/analytics";

const posthogIsPrimary =
  typeof window !== "undefined" &&
  primaryAnalyticsProvider() === "posthog" &&
  ANALYTICS.posthogKey;

if (posthogIsPrimary && !posthog.__loaded) {
  posthog.init(ANALYTICS.posthogKey!, {
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
}

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

/** PostHog — actif uniquement si c'est le fournisseur principal (pas de Plausible en parallèle). */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (primaryAnalyticsProvider() !== "posthog" || !ANALYTICS.posthogKey) {
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
