import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validateFrenchPhone,
  validateFrenchPostcode,
  validatePassword,
  validateSiret,
} from "../validation";

describe("validation client", () => {
  it("valide un téléphone français", () => {
    expect(validateFrenchPhone("06 12 34 56 78")).toBeNull();
    expect(validateFrenchPhone("0612345678")).toBeNull();
  });

  it("rejette un téléphone invalide", () => {
    expect(validateFrenchPhone("123")).not.toBeNull();
  });

  it("valide un SIRET 14 chiffres", () => {
    expect(validateSiret("12345678901234")).toBeNull();
  });

  it("valide code postal et email", () => {
    expect(validateFrenchPostcode("75001")).toBeNull();
    expect(validateEmail("a@b.fr")).toBeNull();
    expect(validatePassword("12345678")).toBeNull();
  });
});
