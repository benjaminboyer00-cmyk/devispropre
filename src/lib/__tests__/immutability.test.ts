import { describe, expect, it } from "vitest";
import {
  assertDevisEditable,
  assertFactureEditable,
  isDevisLocked,
  isFactureLocked,
  ImmutabilityError,
} from "../immutability";

describe("immutability", () => {
  it("devis brouillon éditable", () => {
    expect(isDevisLocked("BROUILLON", null)).toBe(false);
    expect(() => assertDevisEditable("BROUILLON", null)).not.toThrow();
  });

  it("devis envoyé verrouillé", () => {
    expect(isDevisLocked("ENVOYE", new Date())).toBe(true);
    expect(() => assertDevisEditable("ENVOYE", new Date())).toThrow(ImmutabilityError);
  });

  it("facture brouillon éditable", () => {
    expect(isFactureLocked("BROUILLON", null)).toBe(false);
    expect(() => assertFactureEditable("BROUILLON", null)).not.toThrow();
  });

  it("facture émise verrouillée", () => {
    expect(isFactureLocked("EMISE", new Date())).toBe(true);
    expect(() => assertFactureEditable("EMISE", new Date())).toThrow(ImmutabilityError);
  });
});
