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

  it("n'exige plus de OTP email pour la signature en ligne", () => {
    expect(clientRequiresSignatureOtp("client@example.com")).toBe(false);
    expect(clientRequiresSignatureOtp(null)).toBe(false);
  });

  it("autorise la signature en ligne sans email client", () => {
    expect(clientCanSignOnline("client@example.com")).toBe(true);
    expect(clientCanSignOnline("  ")).toBe(true);
    expect(clientCanSignOnline(null)).toBe(true);
  });

  it("limite le bruteforce à 3 tentatives", () => {
    expect(OTP_MAX_VERIFY_ATTEMPTS).toBe(3);
  });
});
