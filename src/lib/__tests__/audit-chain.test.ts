import { describe, expect, it } from "vitest";
import { computeAuditEntryHash, verifyAuditChain, type AuditChainEntry } from "../audit";

function buildChain(n: number) {
  const entries: Array<AuditChainEntry & { entryHash: string }> = [];
  let prevHash: string | null = null;
  for (let seq = 1; seq <= n; seq++) {
    const entry: AuditChainEntry = {
      seq,
      prevHash,
      userId: "user_1",
      action: "UPDATE",
      entityType: "Devis",
      entityId: `devis_${seq}`,
      metadata: JSON.stringify({ step: seq }),
      contentHash: null,
      ipAddress: "203.0.113.1",
      userAgent: "vitest",
      createdAt: new Date(Date.UTC(2026, 9, 2, 12, 0, seq)),
    };
    const entryHash = computeAuditEntryHash(entry);
    entries.push({ ...entry, entryHash });
    prevHash = entryHash;
  }
  return entries;
}

describe("journal d'audit chaîné", () => {
  it("valide une chaîne intacte", () => {
    expect(verifyAuditChain(buildChain(4))).toEqual({ valid: true, checked: 4 });
  });

  it("détecte une métadonnée modifiée", () => {
    const chain = buildChain(4);
    chain[1] = { ...chain[1], metadata: JSON.stringify({ step: 99 }) };
    expect(verifyAuditChain(chain)).toMatchObject({ valid: false, brokenAtSeq: 2, reason: "hash" });
  });

  it("détecte une entrée modifiée puis re-hachée (maillon suivant cassé)", () => {
    const chain = buildChain(4);
    const tampered = { ...chain[1], action: "ACCEPT" };
    chain[1] = { ...tampered, entryHash: computeAuditEntryHash(tampered) };
    expect(verifyAuditChain(chain)).toMatchObject({ valid: false, brokenAtSeq: 3, reason: "link" });
  });

  it("détecte une entrée supprimée", () => {
    const chain = buildChain(4);
    chain.splice(2, 1);
    expect(verifyAuditChain(chain)).toMatchObject({ valid: false, brokenAtSeq: 3, reason: "gap" });
  });

  it("l'empreinte dépend du maillon précédent et de la date", () => {
    const [first] = buildChain(1);
    expect(computeAuditEntryHash({ ...first, prevHash: "x" })).not.toBe(first.entryHash);
    expect(computeAuditEntryHash({ ...first, createdAt: new Date(0) })).not.toBe(first.entryHash);
  });
});
