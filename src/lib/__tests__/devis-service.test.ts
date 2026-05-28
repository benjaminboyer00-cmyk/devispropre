import { describe, expect, it, vi, beforeEach } from "vitest";
import { Plan } from "@/generated/prisma/client";

const userFindFirst = vi.fn();
const companyFindUnique = vi.fn();
const transactionMock = vi.fn();
const logAuditMock = vi.fn();
const assertBillingNotPastDue = vi.fn();
const assertCanCreateDevis = vi.fn();
const enforceFreeDevisQuotaInTransaction = vi.fn();

vi.mock("../db", () => ({
  prisma: {
    user: { findFirst: (...args: unknown[]) => userFindFirst(...args) },
    company: { findUnique: (...args: unknown[]) => companyFindUnique(...args) },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => transactionMock(fn),
  },
}));

vi.mock("../billing-status", () => ({
  assertBillingNotPastDue: (...args: unknown[]) => assertBillingNotPastDue(...args),
}));

vi.mock("../plan-limits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../plan-limits")>();
  return {
    ...actual,
    assertCanCreateDevis: (...args: unknown[]) => assertCanCreateDevis(...args),
    enforceFreeDevisQuotaInTransaction: (...args: unknown[]) =>
      enforceFreeDevisQuotaInTransaction(...args),
  };
});

vi.mock("../numbers", () => ({
  computeLineTotalHT: (q: number, p: number) => q * p,
  computeTotals: (lignes: { totalHT: number; tva: number }[]) => {
    const totalHT = lignes.reduce((s, l) => s + l.totalHT, 0);
    const totalTVA = lignes.reduce((s, l) => s + l.totalHT * (l.tva / 100), 0);
    return { totalHT, totalTVA, totalTTC: totalHT + totalTVA, tauxTVA: 20 };
  },
  nextDevisNumeroInTransaction: vi.fn().mockResolvedValue("DEV-2026-001"),
}));

vi.mock("../audit", () => ({
  logAudit: (...args: unknown[]) => logAuditMock(...args),
}));

import { createDevis } from "../services/devis";
import { ForbiddenError } from "../errors";
import { PlanLimitError } from "../plan-limits";

describe("createDevis", () => {
  const ctx = { userId: "user_1", ipAddress: "127.0.0.1", userAgent: "test" };

  beforeEach(() => {
    userFindFirst.mockReset();
    companyFindUnique.mockReset();
    transactionMock.mockReset();
    logAuditMock.mockReset();
    assertBillingNotPastDue.mockResolvedValue(undefined);
    assertCanCreateDevis.mockResolvedValue(undefined);
    enforceFreeDevisQuotaInTransaction.mockResolvedValue(undefined);
  });

  it("crée un devis avec totaux TVA 20 %", async () => {
    userFindFirst.mockResolvedValue({ plan: Plan.STARTER });
    companyFindUnique.mockResolvedValue({ tvaApplicable: true });

    const created = {
      id: "devis_1",
      numero: "DEV-2026-001",
      totalHT: 100,
      totalTVA: 20,
      totalTTC: 120,
      lignes: [{ description: "Pose", quantite: 1, prixUnitaireHT: 100, tva: 20, totalHT: 100 }],
      client: { nom: "Client A" },
    };

    transactionMock.mockImplementation(async (fn) => {
      const tx = {
        client: {
          findFirst: vi.fn().mockResolvedValue({ id: "client_1", nom: "Client A" }),
        },
        devis: {
          create: vi.fn().mockResolvedValue(created),
        },
      };
      return fn(tx);
    });

    const result = await createDevis(ctx, {
      clientId: "client_1",
      lignes: [{ description: "Pose", quantite: 1, prixUnitaireHT: 100, tva: 20 }],
    });

    expect(result.totalTTC).toBe(120);
    expect(assertBillingNotPastDue).toHaveBeenCalledWith("user_1");
    expect(logAuditMock).toHaveBeenCalled();
  });

  it("refuse un client qui n'appartient pas à l'artisan", async () => {
    userFindFirst.mockResolvedValue({ plan: Plan.FREE });
    companyFindUnique.mockResolvedValue(null);

    transactionMock.mockImplementation(async (fn) => {
      const tx = {
        client: { findFirst: vi.fn().mockResolvedValue(null) },
        devis: { create: vi.fn() },
      };
      return fn(tx);
    });

    await expect(
      createDevis(ctx, {
        clientId: "client_other",
        lignes: [{ description: "X", quantite: 1, prixUnitaireHT: 50 }],
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse si quota FREE dépassé", async () => {
    userFindFirst.mockResolvedValue({ plan: Plan.FREE });
    companyFindUnique.mockResolvedValue({ tvaApplicable: true });
    enforceFreeDevisQuotaInTransaction.mockRejectedValue(
      new PlanLimitError("Quota mensuel de devis atteint.")
    );

    transactionMock.mockImplementation(async (fn) => {
      const tx = {
        client: { findFirst: vi.fn().mockResolvedValue({ id: "client_1", nom: "Client A" }) },
        devis: { create: vi.fn() },
      };
      return fn(tx);
    });

    await expect(
      createDevis(ctx, {
        clientId: "client_1",
        lignes: [{ description: "Pose", quantite: 1, prixUnitaireHT: 100, tva: 20 }],
      })
    ).rejects.toBeInstanceOf(PlanLimitError);
  });
});
