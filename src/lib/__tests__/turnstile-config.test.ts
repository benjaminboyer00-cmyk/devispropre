import { afterEach, describe, expect, it, vi } from "vitest";

describe("getTurnstilePublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("désactivé par défaut même si les clés sont présentes", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const { getTurnstilePublicConfig } = await import("../turnstile-config");
    expect(getTurnstilePublicConfig()).toEqual({ enabled: false, siteKey: "" });
  });

  it("active Turnstile si TURNSTILE_ENFORCE=true et clés présentes", async () => {
    vi.stubEnv("TURNSTILE_ENFORCE", "true");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const { getTurnstilePublicConfig } = await import("../turnstile-config");
    expect(getTurnstilePublicConfig()).toEqual({ enabled: true, siteKey: "site-key" });
  });
});

describe("isTurnstileEnforced", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retourne false sans TURNSTILE_ENFORCE=true", async () => {
    vi.doMock("../env", () => ({
      env: { turnstileSecretKey: "secret", turnstileSiteKey: "site" },
    }));
    vi.resetModules();
    const { isTurnstileEnforced } = await import("../turnstile");
    expect(isTurnstileEnforced()).toBe(false);
  });

  it("retourne true si TURNSTILE_ENFORCE=true et clés présentes", async () => {
    vi.stubEnv("TURNSTILE_ENFORCE", "true");
    vi.doMock("../env", () => ({
      env: { turnstileSecretKey: "secret", turnstileSiteKey: "site" },
    }));
    vi.resetModules();
    const { isTurnstileEnforced } = await import("../turnstile");
    expect(isTurnstileEnforced()).toBe(true);
  });
});
