import { describe, expect, it } from "vitest";
import {
  OTP_MAX_VERIFY_ATTEMPTS,
  clientCanSignOnline,
  clientRequiresSignatureOtp,
  maskClientEmail,
} from "../devis-signature-otp";

describe("devis-signature-otp helpers", () => {
  it("masque l'email client", () => {
    expect(maskClientEmail("client@example.com")).toBe("cl***@example.com");
    expect(maskClientEmail("a@b.fr")).toBe("a***@b.fr");
  });

  it("exige OTP pour toute signature en ligne", () => {
    expect(clientRequiresSignatureOtp("client@example.com")).toBe(true);
    expect(clientRequiresSignatureOtp("  ")).toBe(true);
    expect(clientRequiresSignatureOtp(null)).toBe(true);
  });

  it("bloque la signature en ligne sans email client", () => {
    expect(clientCanSignOnline("client@example.com")).toBe(true);
    expect(clientCanSignOnline("  ")).toBe(false);
    expect(clientCanSignOnline(null)).toBe(false);
  });

  it("limite le bruteforce à 3 tentatives", () => {
    expect(OTP_MAX_VERIFY_ATTEMPTS).toBe(3);
  });
});
