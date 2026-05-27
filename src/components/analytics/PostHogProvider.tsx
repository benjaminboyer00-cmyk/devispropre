"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ANALYTICS } from "@/lib/analytics";

if (typeof window !== "undefined" && ANALYTICS.posthogKey && !posthog.__loaded) {
  posthog.init(ANALYTICS.posthogKey, {
    api_host: ANALYTICS.posthogHost,
    ui_host: ANALYTICS.posthogHost.includes("eu.") ? "https://eu.posthog.com" : "https://app.posthog.com",
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
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    client.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, client]);

  return null;
}

/** PostHog — replays session, heatmaps, funnels UX/design. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!ANALYTICS.posthogKey) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageViewInner />
      </Suspense>
      {children}
    </PHProvider>
  );
}
