import { describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({
  env: {
    isProd: false,
    stripeSecretKey: "",
    stripePriceStarter: "",
    stripePricePro: "",
  },
}));

import { getStripeCheckoutError, isStripeCheckoutConfigured } from "../stripe";

describe("stripe config", () => {
  it("signale l'absence de clé secrète en dev", () => {
    expect(getStripeCheckoutError("STARTER")).toContain("STRIPE_SECRET_KEY");
    expect(isStripeCheckoutConfigured("STARTER")).toBe(false);
  });
});
