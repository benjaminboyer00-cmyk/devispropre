/** Configuration analytics — un seul fournisseur actif à la fois (priorité : Plausible > PostHog > Vercel). */

import { hasAnalyticsConsent } from "./cookie-consent";

export const ANALYTICS = {
  gtmId: process.env.NEXT_PUBLIC_GTM_ID?.trim() || null,
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null,
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || null,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
  /** Vercel Analytics — uniquement sur Vercel (opt-in explicite). */
  vercelInsights: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "true",
} as const;

export type AnalyticsProvider = "plausible" | "posthog" | "vercel";

export function googleAnalyticsEnabled(): boolean {
  return Boolean(ANALYTICS.gtmId || ANALYTICS.gaMeasurementId);
}

/** Push dataLayer — GTM / GA4. */
export function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/** Fournisseur unique — évite Plausible + PostHog + API interne en parallèle. */
export function primaryAnalyticsProvider(): AnalyticsProvider | null {
  if (ANALYTICS.plausibleDomain) return "plausible";
  if (ANALYTICS.posthogKey) return "posthog";
  if (ANALYTICS.vercelInsights) return "vercel";
  return null;
}

export function analyticsEnabled(): boolean {
  return googleAnalyticsEnabled() || primaryAnalyticsProvider() !== null;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

/** Événement custom — GTM dataLayer + fournisseur actif (Plausible / PostHog). */
export function trackEvent(name: string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return;

  if (ANALYTICS.gtmId || ANALYTICS.gaMeasurementId) {
    if (!hasAnalyticsConsent()) return;
    pushDataLayer({ event: name, ...(props ?? {}) });
  }

  const provider = primaryAnalyticsProvider();
  if (!hasAnalyticsConsent() && provider) return;

  if (provider === "plausible" && window.plausible) {
    window.plausible(name, props ? { props } : undefined);
    return;
  }

  if (provider === "posthog") {
    import("posthog-js")
      .then(({ default: posthog }) => {
        if (posthog.__loaded) {
          posthog.capture(name, props);
        }
      })
      .catch(() => {});
  }
}
