import { afterEach, describe, expect, it, vi } from "vitest";

describe("primaryAnalyticsProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("priorise Plausible sur PostHog", async () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "devispropre.fr");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.resetModules();
    const { primaryAnalyticsProvider } = await import("../analytics");
    expect(primaryAnalyticsProvider()).toBe("plausible");
  });

  it("utilise PostHog si Plausible absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.resetModules();
    const { primaryAnalyticsProvider } = await import("../analytics");
    expect(primaryAnalyticsProvider()).toBe("posthog");
  });

  it("retourne null si tout est désactivé", async () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ANALYTICS", "false");
    vi.resetModules();
    const { primaryAnalyticsProvider } = await import("../analytics");
    expect(primaryAnalyticsProvider()).toBe(null);
  });
});
