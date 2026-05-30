import { afterEach, describe, expect, it, vi } from "vitest";

describe("getTurnstilePublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("désactive Turnstile si TURNSTILE_ENFORCE=false", async () => {
    vi.stubEnv("TURNSTILE_ENFORCE", "false");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const { getTurnstilePublicConfig } = await import("../turnstile-config");
    expect(getTurnstilePublicConfig()).toEqual({ enabled: false, siteKey: "" });
  });

  it("active Turnstile si clés présentes", async () => {
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

  it("retourne false si TURNSTILE_ENFORCE=false", async () => {
    vi.stubEnv("TURNSTILE_ENFORCE", "false");
    vi.doMock("../env", () => ({
      env: { turnstileSecretKey: "secret", turnstileSiteKey: "site" },
    }));
    vi.resetModules();
    const { isTurnstileEnforced } = await import("../turnstile");
    expect(isTurnstileEnforced()).toBe(false);
  });
});
