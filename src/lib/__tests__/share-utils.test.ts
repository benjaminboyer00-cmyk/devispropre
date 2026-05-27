import { describe, expect, it } from "vitest";
import { mailShareHref, smsShareHref, whatsAppShareHref } from "../share-utils";

describe("share-utils", () => {
  it("normalise le téléphone pour WhatsApp", () => {
    const href = whatsAppShareHref("06 12 34 56 78", "Bonjour");
    expect(href).toContain("0612345678");
    expect(href).toContain("text=");
  });

  it("génère un lien SMS", () => {
    expect(smsShareHref("0612345678", "Devis")).toMatch(/^sms:0612345678\?body=/);
  });

  it("génère un mailto", () => {
    expect(mailShareHref("Devis", "Lien")).toMatch(/^mailto:\?subject=/);
  });
});
