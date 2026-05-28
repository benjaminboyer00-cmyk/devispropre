import { describe, expect, it } from "vitest";
import {
  OTP_MAX_VERIFY_ATTEMPTS,
  clientRequiresSignatureOtp,
  maskClientEmail,
} from "../devis-signature-otp";

describe("devis-signature-otp helpers", () => {
  it("masque l'email client", () => {
    expect(maskClientEmail("client@example.com")).toBe("cl***@example.com");
    expect(maskClientEmail("a@b.fr")).toBe("a***@b.fr");
  });

  it("exige OTP si email client présent", () => {
    expect(clientRequiresSignatureOtp("client@example.com")).toBe(true);
    expect(clientRequiresSignatureOtp("  ")).toBe(false);
    expect(clientRequiresSignatureOtp(null)).toBe(false);
  });

  it("limite le bruteforce à 3 tentatives", () => {
    expect(OTP_MAX_VERIFY_ATTEMPTS).toBe(3);
  });
});
