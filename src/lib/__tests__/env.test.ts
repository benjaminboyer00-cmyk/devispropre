import { afterEach, describe, expect, it, vi } from "vitest";

function stubCompleteProdEnv(overrides: Record<string, string> = {}) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("JWT_SECRET", "a".repeat(32));
  vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://devispropre.fr");
  vi.stubEnv("ALLOWED_ORIGINS", "https://devispropre.fr");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "turnstile-secret-key");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "turnstile-site-key");
  vi.stubEnv("CRON_SECRET", "cron-secret-key");
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_test");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  vi.stubEnv("STRIPE_PRICE_STARTER", "price_starter");
  vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
  vi.stubEnv("R2_ACCOUNT_ID", "r2-account");
  vi.stubEnv("R2_ACCESS_KEY_ID", "r2-key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "r2-secret");
  vi.stubEnv("R2_BUCKET", "devispropre-pdfs");
  vi.stubEnv("SITE_SAME_AS", "https://www.linkedin.com/in/example");
  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value);
  }
}

describe("validateEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("n'exige pas les variables en développement", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("exige Turnstile en production", async () => {
    stubCompleteProdEnv({ TURNSTILE_SECRET_KEY: "" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(/TURNSTILE_SECRET_KEY/);
  });

  it("n'exige pas Turnstile si TURNSTILE_ENFORCE=false", async () => {
    stubCompleteProdEnv({
      TURNSTILE_ENFORCE: "false",
      TURNSTILE_SECRET_KEY: "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("exige Stripe et Resend en production", async () => {
    stubCompleteProdEnv({ STRIPE_SECRET_KEY: "" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("exige R2 et SITE_SAME_AS en production", async () => {
    stubCompleteProdEnv({ R2_BUCKET: "" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(/R2_BUCKET/);
  });

  it("accepte la config production complète", async () => {
    stubCompleteProdEnv();
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("refuse ALLOWED_ORIGINS avec wildcard en production", async () => {
    stubCompleteProdEnv({ ALLOWED_ORIGINS: "*" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(/wildcard/i);
  });
});
