import { describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({
  env: {
    stripePriceStarter: "price_starter",
    stripePricePro: "price_pro",
  },
}));

import {
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  planFromStripePrice,
  shouldDowngradeToFree,
} from "../stripe-subscription";

vi.mock("../billing-status", () => ({
  markCustomerPastDue: vi.fn(),
  clearCustomerPastDue: vi.fn(),
}));

import { clearCustomerPastDue, markCustomerPastDue } from "../billing-status";

describe("stripe-subscription", () => {
  it("mappe les price IDs Stripe vers les plans", () => {
    expect(planFromStripePrice("price_starter")).toBe("STARTER");
    expect(planFromStripePrice("price_pro")).toBe("PRO");
    expect(planFromStripePrice("price_unknown")).toBeNull();
  });

  it("identifie les statuts à rétrograder en FREE", () => {
    expect(shouldDowngradeToFree("canceled")).toBe(true);
    expect(shouldDowngradeToFree("unpaid")).toBe(true);
    expect(shouldDowngradeToFree("active")).toBe(false);
    expect(shouldDowngradeToFree("past_due")).toBe(false);
  });

  it("marque past_due sur invoice.payment_failed", async () => {
    await handleInvoicePaymentFailed({ customer: "cus_1" } as never);
    expect(markCustomerPastDue).toHaveBeenCalledWith("cus_1");
  });

  it("efface past_due sur invoice.paid", async () => {
    await handleInvoicePaid({ customer: "cus_1" } as never);
    expect(clearCustomerPastDue).toHaveBeenCalledWith("cus_1");
  });
});
