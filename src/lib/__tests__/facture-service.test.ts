import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  devisFindFirst,
  clientFindFirst,
  transactionMock,
  nextFactureNumeroInTransaction,
  logAuditMock,
  assertBillingNotPastDue,
  assertStarterFeature,
  userFindFirst,
} = vi.hoisted(() => ({
  devisFindFirst: vi.fn(),
  clientFindFirst: vi.fn(),
  transactionMock: vi.fn(),
  nextFactureNumeroInTransaction: vi.fn(),
  logAuditMock: vi.fn(),
  assertBillingNotPastDue: vi.fn(),
  assertStarterFeature: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("../db", () => ({
  prisma: {
    devis: { findFirst: (...args: unknown[]) => devisFindFirst(...args) },
    client: { findFirst: (...args: unknown[]) => clientFindFirst(...args) },
    user: { findFirst: (...args: unknown[]) => userFindFirst(...args) },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => transactionMock(fn),
  },
}));

vi.mock("../billing-status", () => ({
  assertBillingNotPastDue: (...args: unknown[]) => assertBillingNotPastDue(...args),
}));

vi.mock("../plan-features", () => ({
  assertStarterFeature: (...args: unknown[]) => assertStarterFeature(...args),
}));

vi.mock("../numbers", () => ({
  nextFactureNumeroInTransaction: (...args: unknown[]) =>
    nextFactureNumeroInTransaction(...args),
  computeLineTotalHT: (q: number, p: number) => q * p,
  computeTotals: () => ({ totalHT: 0, totalTVA: 0, totalTTC: 0, tauxTVA: 20 }),
}));

vi.mock("../audit", () => ({
  logAudit: (...args: unknown[]) => logAuditMock(...args),
}));

import { createFactureFromDevis } from "../services/facture";
import { ForbiddenError } from "../errors";

describe("createFactureFromDevis", () => {
  const ctx = { userId: "user_1", ipAddress: null, userAgent: "test" };

  beforeEach(() => {
    devisFindFirst.mockReset();
    clientFindFirst.mockReset();
    transactionMock.mockReset();
    nextFactureNumeroInTransaction.mockReset();
    logAuditMock.mockReset();
    assertBillingNotPastDue.mockResolvedValue(undefined);
    userFindFirst.mockResolvedValue({ plan: "STARTER", stripeCustomerId: "cus_1" });
    nextFactureNumeroInTransaction.mockResolvedValue("FAC-2026-001");
  });

  it("refuse un devis non accepté", async () => {
    devisFindFirst.mockResolvedValue({
      id: "devis_1",
      clientId: "client_1",
      status: "ENVOYE",
      facture: null,
      lignes: [],
      totalHT: 100,
      totalTVA: 20,
      totalTTC: 120,
      tauxTVA: 20,
      notes: null,
    });
    clientFindFirst.mockResolvedValue({ id: "client_1" });

    await expect(createFactureFromDevis(ctx, "devis_1")).rejects.toThrow(
      "Seul un devis accepté"
    );
  });

  it("refuse un devis introuvable (IDOR)", async () => {
    devisFindFirst.mockResolvedValue(null);

    await expect(createFactureFromDevis(ctx, "devis_x")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("convertit un devis accepté en facture brouillon", async () => {
    devisFindFirst.mockResolvedValue({
      id: "devis_1",
      clientId: "client_1",
      status: "ACCEPTE",
      facture: null,
      lignes: [
        {
          ordre: 1,
          description: "Travaux",
          quantite: 1,
          prixUnitaireHT: 500,
          tva: 20,
          totalHT: 500,
        },
      ],
      totalHT: 500,
      totalTVA: 100,
      totalTTC: 600,
      tauxTVA: 20,
      notes: null,
    });
    clientFindFirst.mockResolvedValue({ id: "client_1" });

    const factureCreated = {
      id: "fac_1",
      numero: "FAC-2026-001",
      totalTTC: 600,
      lignes: [],
      client: { nom: "Client" },
    };

    transactionMock.mockImplementation(async (fn) => {
      const tx = {
        facture: { create: vi.fn().mockResolvedValue(factureCreated) },
        devis: { update: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const facture = await createFactureFromDevis(ctx, "devis_1");
    expect(facture.numero).toBe("FAC-2026-001");
    expect(logAuditMock).toHaveBeenCalled();
  });

  it("convertit un devis accepté franchise TVA (0 %)", async () => {
    devisFindFirst.mockResolvedValue({
      id: "devis_1",
      clientId: "client_1",
      status: "ACCEPTE",
      facture: null,
      lignes: [
        {
          ordre: 1,
          description: "Travaux",
          quantite: 1,
          prixUnitaireHT: 500,
          tva: 0,
          totalHT: 500,
        },
      ],
      totalHT: 500,
      totalTVA: 0,
      totalTTC: 500,
      tauxTVA: 0,
      notes: "TVA non applicable, art. 293 B du CGI.",
    });
    clientFindFirst.mockResolvedValue({ id: "client_1" });

    const factureCreated = {
      id: "fac_1",
      numero: "FAC-2026-001",
      totalHT: 500,
      totalTVA: 0,
      totalTTC: 500,
      tauxTVA: 0,
      lignes: [],
      client: { nom: "Client" },
    };

    transactionMock.mockImplementation(async (fn) => {
      const tx = {
        facture: { create: vi.fn().mockResolvedValue(factureCreated) },
        devis: { update: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const facture = await createFactureFromDevis(ctx, "devis_1");
    expect(facture.totalTTC).toBe(500);
    expect(facture.totalTVA).toBe(0);
  });
});
