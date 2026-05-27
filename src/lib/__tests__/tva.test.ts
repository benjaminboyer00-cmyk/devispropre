import { describe, expect, it } from "vitest";
import {
  computeDraftTotals,
  computeLineTtc,
  FRANCHISE_MENTION,
  ensureFranchiseNotes,
  resolveLineTva,
} from "../tva";

describe("tva", () => {
  it("force 0 % en franchise en base", () => {
    expect(resolveLineTva(20, false)).toBe(0);
  });

  it("accepte 0 % pour un assujetti (ligne exonérée)", () => {
    expect(resolveLineTva(0, true)).toBe(0);
  });

  it("calcule le TTC avec TVA 0 %", () => {
    expect(computeLineTtc(1, 100, 0, true)).toBe(100);
  });

  it("calcule le TTC en franchise (HT = TTC)", () => {
    expect(computeLineTtc(1, 100, 20, false)).toBe(100);
  });

  it("totaux mixtes 10 % + 0 %", () => {
    const t = computeDraftTotals(
      [
        { quantite: 1, prixUnitaireHT: 1000, tva: 10 },
        { quantite: 1, prixUnitaireHT: 200, tva: 0 },
      ],
      true
    );
    expect(t.totalHT).toBe(1200);
    expect(t.totalTVA).toBe(100);
    expect(t.totalTTC).toBe(1300);
  });

  it("ajoute la mention 293 B aux notes franchise", () => {
    expect(ensureFranchiseNotes(undefined, false)).toBe(FRANCHISE_MENTION);
    expect(ensureFranchiseNotes("Délai 2 semaines", false)).toContain("293 B");
  });
});
