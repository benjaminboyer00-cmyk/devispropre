import { prisma } from "./db";

export async function nextDevisNumero(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  const last = await prisma.devis.findFirst({
    where: { userId, numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  const lastSeq = last ? parseInt(last.numero.split("-").pop() ?? "0", 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

export async function nextFactureNumero(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  const last = await prisma.facture.findFirst({
    where: { userId, numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  const lastSeq = last ? parseInt(last.numero.split("-").pop() ?? "0", 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

export function computeLineTotalHT(quantite: number, prixUnitaireHT: number): number {
  return Math.round(quantite * prixUnitaireHT * 100) / 100;
}

export function computeTotals(
  lignes: { totalHT: number; tva: number }[]
): { totalHT: number; totalTVA: number; totalTTC: number } {
  let totalHT = 0;
  let totalTVA = 0;

  for (const l of lignes) {
    totalHT += l.totalHT;
    totalTVA += Math.round(l.totalHT * (l.tva / 100) * 100) / 100;
  }

  totalHT = Math.round(totalHT * 100) / 100;
  totalTVA = Math.round(totalTVA * 100) / 100;

  return {
    totalHT,
    totalTVA,
    totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
  };
}
