import { describe, expect, it } from "vitest";
import { MAX_LOGO_BYTES, parseLogoDataUri } from "../logo-storage";

describe("parseLogoDataUri", () => {
  const tinyPng = "data:image/png;base64,iVBORw0KGgo=";

  it("accepte un PNG valide", () => {
    const { ext } = parseLogoDataUri(tinyPng);
    expect(ext).toBe("png");
  });

  it("rejette un MIME non autorisé", () => {
    expect(() => parseLogoDataUri("data:image/gif;base64,AAAA")).toThrow(/invalide/i);
  });

  it("rejette une URL externe", () => {
    expect(() => parseLogoDataUri("https://evil.com/logo.png")).toThrow(/invalide/i);
  });

  it("rejette un fichier trop volumineux", () => {
    const big = Buffer.alloc(MAX_LOGO_BYTES + 1).toString("base64");
    expect(() => parseLogoDataUri(`data:image/png;base64,${big}`)).toThrow(/volumineux/i);
  });
});

describe("computeTotals", () => {
  it("calcule HT/TVA/TTC", async () => {
    const { computeTotals } = await import("../numbers");
    const totals = computeTotals([{ totalHT: 100, tva: 20 }]);
    expect(totals.totalHT).toBe(100);
    expect(totals.totalTVA).toBe(20);
    expect(totals.totalTTC).toBe(120);
  });
});
