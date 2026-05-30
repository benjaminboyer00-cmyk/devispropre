import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "../security-headers";

describe("buildContentSecurityPolicy", () => {
  it("inclut le nonce dans script-src et style-src-elem", () => {
    const csp = buildContentSecurityPolicy("abc123XYZ");
    expect(csp).toContain("'nonce-abc123XYZ'");
    expect(csp).toContain("style-src-elem 'self' 'unsafe-inline' 'nonce-abc123XYZ'");
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).toContain("font-src 'self'");
  });

  it("autorise Stripe", () => {
    const csp = buildContentSecurityPolicy("n");
    expect(csp).toContain("https://js.stripe.com");
    expect(csp).toContain("https://api.stripe.com");
  });

  it("autorise Cloudflare Turnstile (unsafe-eval requis)", () => {
    const csp = buildContentSecurityPolicy("n");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain("strict-dynamic");
    expect(csp).toContain("child-src 'self' https://challenges.cloudflare.com");
  });

  it("autorise les outils analytics", () => {
    const csp = buildContentSecurityPolicy("n");
    expect(csp).toContain("https://plausible.io");
    expect(csp).toContain("https://eu.i.posthog.com");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://www.google-analytics.com");
  });
});
