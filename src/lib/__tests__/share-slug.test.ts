import { describe, expect, it } from "vitest";
import {
  buildDevisShareSlug,
  buildFactureShareSlug,
  isValidPublicShareRef,
  isValidShareSlugFormat,
  publicShareLookupWhere,
} from "../share-slug";

const LEGACY_TOKEN = "a".repeat(64);

describe("share-slug", () => {
  it("génère un slug devis lisible", () => {
    expect(buildDevisShareSlug("DEV-2026-0003")).toBe("devis-dev-2026-0003");
  });

  it("génère un slug facture lisible", () => {
    expect(buildFactureShareSlug("FAC-2026-0001")).toBe("facture-fac-2026-0001");
  });

  it("accepte slug ou token legacy", () => {
    expect(isValidShareSlugFormat("devis-dev-2026-0003")).toBe(true);
    expect(isValidPublicShareRef(LEGACY_TOKEN)).toBe(true);
    expect(isValidPublicShareRef("invalid")).toBe(false);
  });

  it("résout le lookup par slug", () => {
    expect(publicShareLookupWhere("devis-dev-2026-0003")).toEqual({
      shareSlug: "devis-dev-2026-0003",
    });
  });
});
