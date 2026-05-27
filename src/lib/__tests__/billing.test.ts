import { describe, expect, it } from "vitest";
import { TRIAL_PERIOD_DAYS, isEligibleForTrial } from "../billing-constants";

describe("billing", () => {
  it("essai de 15 jours", () => {
    expect(TRIAL_PERIOD_DAYS).toBe(15);
  });

  it("essai réservé aux nouveaux clients Stripe", () => {
    expect(isEligibleForTrial(null)).toBe(true);
    expect(isEligibleForTrial(undefined)).toBe(true);
    expect(isEligibleForTrial("cus_abc")).toBe(false);
  });
});
