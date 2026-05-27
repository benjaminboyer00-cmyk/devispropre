import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

type DocType = "DEVIS" | "FACTURE";
type DbClient = Prisma.TransactionClient | typeof prisma;

async function nextSequence(db: DbClient, userId: string, docType: DocType): Promise<number> {
  const year = new Date().getFullYear();

  const rows = await db.$queryRaw<{ lastSeq: number }[]>`
    INSERT INTO "DocumentCounter" ("id", "userId", "year", "docType", "lastSeq", "updatedAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${year}, ${docType}, 1, NOW())
    ON CONFLICT ("userId", "year", "docType")
    DO UPDATE SET "lastSeq" = "DocumentCounter"."lastSeq" + 1, "updatedAt" = NOW()
    RETURNING "lastSeq"
  `;

  return rows[0]?.lastSeq ?? 1;
}

export async function nextDevisNumero(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(prisma, userId, "DEVIS");
  return `DEV-${year}-${String(seq).padStart(4, "0")}`;
}

export async function nextDevisNumeroInTransaction(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(tx, userId, "DEVIS");
  return `DEV-${year}-${String(seq).padStart(4, "0")}`;
}

export async function nextFactureNumero(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(prisma, userId, "FACTURE");
  return `FAC-${year}-${String(seq).padStart(4, "0")}`;
}

export function computeLineTotalHT(quantite: number, prixUnitaireHT: number): number {
  return Math.round(quantite * prixUnitaireHT * 100) / 100;
}

export function computeTotals(
  lignes: { totalHT: number; tva: number }[],
  tvaApplicable = true
): { totalHT: number; totalTVA: number; totalTTC: number } {
  let totalHT = 0;
  let totalTVA = 0;

  for (const l of lignes) {
    totalHT += l.totalHT;
    if (tvaApplicable) {
      totalTVA += Math.round(l.totalHT * (l.tva / 100) * 100) / 100;
    }
  }

  totalHT = Math.round(totalHT * 100) / 100;
  totalTVA = Math.round(totalTVA * 100) / 100;

  return {
    totalHT,
    totalTVA,
    totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
  };
}
