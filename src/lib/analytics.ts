/** Configuration analytics — un seul fournisseur actif à la fois (priorité : Plausible > PostHog > Vercel). */

export const ANALYTICS = {
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || null,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
  /** Vercel Analytics — uniquement sur Vercel (opt-in explicite). */
  vercelInsights: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "true",
} as const;

export type AnalyticsProvider = "plausible" | "posthog" | "vercel";

/** Fournisseur unique — évite Plausible + PostHog + API interne en parallèle. */
export function primaryAnalyticsProvider(): AnalyticsProvider | null {
  if (ANALYTICS.plausibleDomain) return "plausible";
  if (ANALYTICS.posthogKey) return "posthog";
  if (ANALYTICS.vercelInsights) return "vercel";
  return null;
}

export function analyticsEnabled(): boolean {
  return primaryAnalyticsProvider() !== null;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

/** Événement custom — routé vers le fournisseur actif uniquement. */
export function trackEvent(name: string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return;

  const provider = primaryAnalyticsProvider();

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
