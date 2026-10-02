import { describe, expect, it } from "vitest";
import {
  OTP_MAX_VERIFY_ATTEMPTS,
  clientCanSignOnline,
  clientRequiresSignatureOtp,
  maskClientEmail,
  normalizeSignerEmail,
  resolveSignerEmail,
} from "../devis-signature-otp";

describe("devis-signature-otp helpers", () => {
  it("masque l'email client", () => {
    expect(maskClientEmail("client@example.com")).toBe("cl***@example.com");
    expect(maskClientEmail("a@b.fr")).toBe("a***@b.fr");
  });

  it("exige toujours un OTP email pour la signature en ligne", () => {
    expect(clientRequiresSignatureOtp("client@example.com")).toBe(true);
    expect(clientRequiresSignatureOtp(null)).toBe(true);
  });

  it("autorise la signature en ligne même sans email sur la fiche client", () => {
    expect(clientCanSignOnline("client@example.com")).toBe(true);
    expect(clientCanSignOnline(null)).toBe(true);
  });

  it("normalise et valide l'email du signataire", () => {
    expect(normalizeSignerEmail("  Client@Example.COM ")).toBe("client@example.com");
    expect(normalizeSignerEmail("pas-un-email")).toBeNull();
    expect(normalizeSignerEmail("  ")).toBeNull();
    expect(normalizeSignerEmail(null)).toBeNull();
  });

  it("privilégie l'email de la fiche client — non contournable par le signataire", () => {
    expect(resolveSignerEmail("client@example.com", "attaquant@evil.test")).toEqual({
      email: "client@example.com",
      source: "client_record",
    });
  });

  it("utilise l'email déclaré si la fiche client n'en a pas", () => {
    expect(resolveSignerEmail(null, "moi@example.com")).toEqual({
      email: "moi@example.com",
      source: "declared_by_signer",
    });
    expect(resolveSignerEmail(null, "invalide")).toBeNull();
  });

  it("limite le bruteforce à 3 tentatives", () => {
    expect(OTP_MAX_VERIFY_ATTEMPTS).toBe(3);
  });
});

describe("empreinte des codes OTP", () => {
  it("HMAC lié au devis, non égal au SHA-256 nu", async () => {
    const { hashOtpCode, otpCodeMatches } = await import("../devis-signature-otp");
    const { sha256 } = await import("../crypto");
    const stored = hashOtpCode("devis_a", "123456");
    expect(stored.startsWith("h1:")).toBe(true);
    expect(stored).not.toContain(sha256("123456"));
    expect(otpCodeMatches(stored, "devis_a", "123456")).toBe(true);
    expect(otpCodeMatches(stored, "devis_a", "654321")).toBe(false);
    expect(otpCodeMatches(stored, "devis_b", "123456")).toBe(false);
  });

  it("accepte encore un code legacy SHA-256 émis avant la migration", async () => {
    const { otpCodeMatches } = await import("../devis-signature-otp");
    const { sha256 } = await import("../crypto");
    expect(otpCodeMatches(sha256("111111"), "devis_a", "111111")).toBe(true);
    expect(otpCodeMatches(sha256("111111"), "devis_a", "222222")).toBe(false);
  });
});
