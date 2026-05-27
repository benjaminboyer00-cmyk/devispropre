/** Configuration analytics — activée en production si les clés/env sont définies. */

export const ANALYTICS = {
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || null,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
  /** Vercel Analytics / Speed Insights — actifs sur Vercel sans clé. */
  vercelInsights: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS !== "false",
} as const;

export function analyticsEnabled(): boolean {
  return Boolean(ANALYTICS.plausibleDomain || ANALYTICS.posthogKey || ANALYTICS.vercelInsights);
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

/** Événement custom — Plausible + PostHog (CTA, guides, conversions). */
export function trackEvent(name: string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return;

  if (window.plausible) {
    window.plausible(name, props ? { props } : undefined);
  }

  import("posthog-js")
    .then(({ default: posthog }) => {
      if (posthog.__loaded) {
        posthog.capture(name, props);
      }
    })
    .catch(() => {});
}
