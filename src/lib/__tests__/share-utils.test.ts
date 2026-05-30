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
  const sample = buildDevisShareMessage(
    "DEV-2026-0003",
    "Jean Dupont",
    "https://devispropre.com/devis/devis-dev-2026-0003"
  );

  it("masque l’URL dans le message affiché", () => {
    const text = documentShareDisplayText(sample);
    expect(text).toContain("disponible en ligne :");
    expect(text).toContain("\ndevis\n");
    expect(text).not.toContain("https://devispropre.com/devis/devis-dev-2026-0003");
  });

  it("inclut l’URL courte pour WhatsApp, SMS et mailto", () => {
    const text = documentShareExternalText(sample);
    expect(text).toContain("https://devispropre.com/devis/devis-dev-2026-0003");
  });

  it("génère du HTML avec un lien sur le mot devis", () => {
    const html = documentShareHtml(sample);
    expect(html).toContain(
      '<a href="https://devispropre.com/devis/devis-dev-2026-0003">devis</a>'
    );
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
