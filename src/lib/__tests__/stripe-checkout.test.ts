import { describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({
  env: {
    appUrl: "https://devispropre.fr",
    stripePriceStarter: "price_test_starter",
    stripePricePro: "price_test_pro",
  },
}));

import { buildCheckoutSessionParams } from "../stripe-checkout";

describe("buildCheckoutSessionParams", () => {
  const base = {
    userId: "user_1",
    email: "artisan@example.fr",
    plan: "STARTER" as const,
    appUrl: "https://devispropre.fr",
  };

  it("active un essai 15 jours avec carte pour un nouveau client", () => {
    const result = buildCheckoutSessionParams({ ...base, withTrial: true });
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.applyTrial).toBe(true);
    expect(result.params.payment_method_collection).toBe("always");
    expect(result.params.subscription_data?.trial_period_days).toBe(15);
    expect(result.params.cancel_url).toContain("/dashboard/activer");
    expect(result.params.customer_email).toBe(base.email);
  });

  it("refuse un second essai si le client Stripe existe déjà", () => {
    const result = buildCheckoutSessionParams({
      ...base,
      withTrial: true,
      stripeCustomerId: "cus_existing",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.applyTrial).toBe(false);
    expect(result.params.payment_method_collection).toBeUndefined();
    expect(result.params.subscription_data?.trial_period_days).toBeUndefined();
    expect(result.params.customer).toBe("cus_existing");
  });

  it("upgrade sans essai redirige vers les tarifs en cas d'annulation", () => {
    const result = buildCheckoutSessionParams({ ...base, withTrial: false });
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.params.cancel_url).toContain("/tarifs?checkout=cancel");
  });
});
