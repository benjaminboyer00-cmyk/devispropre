import { describe, expect, it } from "vitest";
import {
  buildDevisShareMessage,
  documentShareDisplayText,
  documentShareExternalText,
  documentShareHtml,
  mailShareHref,
  smsShareHref,
  whatsAppShareHref,
} from "../share-utils";

describe("share-utils", () => {
  const sample = buildDevisShareMessage("DEV-2026-0003", "Jean Dupont", "https://devispropre.com/devis/abc123");

  it("masque l’URL dans le message affiché", () => {
    const text = documentShareDisplayText(sample);
    expect(text).toContain("« devis »");
    expect(text).toContain("\ndevis\n");
    expect(text).not.toContain("https://devispropre.com/devis/abc123");
  });

  it("inclut l’URL pour WhatsApp, SMS et mailto", () => {
    const text = documentShareExternalText(sample);
    expect(text).toContain("https://devispropre.com/devis/abc123");
  });

  it("génère du HTML avec un lien sur le mot devis", () => {
    const html = documentShareHtml(sample);
    expect(html).toContain('<a href="https://devispropre.com/devis/abc123">devis</a>');
    expect(html).not.toContain("abc123</a>");
  });

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
