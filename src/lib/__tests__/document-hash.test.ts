import { describe, expect, it } from "vitest";
import { canonicalize, sha256 } from "../crypto";
import {
  computeChainHash,
  computeContentHash,
  verifyDocumentIntegrity,
} from "../document-hash";

describe("crypto", () => {
  it("sha256 est déterministe", () => {
    expect(sha256("test")).toBe(sha256("test"));
    expect(sha256("test")).toHaveLength(64);
  });

  it("canonicalize trie les clés récursivement", () => {
    const a = canonicalize({ b: 1, a: { z: 2, y: 3 } });
    const b = canonicalize({ a: { y: 3, z: 2 }, b: 1 });
    expect(a).toBe(b);
  });
});

describe("document-hash", () => {
  it("computeContentHash est stable", () => {
    const payload = { numero: "DEV-2026-0001", totalTTC: 120 };
    const h1 = computeContentHash(payload);
    const h2 = computeContentHash({ ...payload });
    expect(h1).toBe(h2);
  });

  it("verifyDocumentIntegrity détecte les altérations", () => {
    const payload = { numero: "FAC-2026-0001", totalTTC: 500 };
    const hash = computeContentHash(payload);
    expect(verifyDocumentIntegrity(hash, payload)).toBe(true);
    expect(verifyDocumentIntegrity(hash, { ...payload, totalTTC: 501 })).toBe(false);
  });

  it("computeChainHash chaîne les empreintes", () => {
    const h1 = sha256("doc1");
    const h2 = computeChainHash(h1, null);
    const h3 = computeChainHash(sha256("doc2"), h1);
    expect(h2).not.toBe(h3);
  });
});
