import type { DevisStatus } from "@/generated/prisma/client";
import { logAudit, type AuditContext } from "../audit";
import { generateShareToken } from "../crypto";
import {
  buildDevisPayload,
  computeChainHash,
  computeContentHash,
  verifyDocumentIntegrity,
} from "../document-hash";
import { prisma } from "../db";
import { assertDevisEditable, ImmutabilityError, isDevisLocked } from "../immutability";
import { computeLineTotalHT, computeTotals, nextDevisNumero } from "../numbers";

export interface LigneInput {
  description: string;
  quantite: number;
  prixUnitaireHT: number;
  tva?: number;
}

export async function createDevis(
  ctx: AuditContext,
  data: {
    clientId: string;
    lignes: LigneInput[];
    notes?: string;
    validUntil?: Date;
  }
) {
  const numero = await nextDevisNumero(ctx.userId);
  const lignesData = data.lignes.map((l, i) => {
    const tva = l.tva ?? 20;
    const totalHT = computeLineTotalHT(l.quantite, l.prixUnitaireHT);
    return {
      ordre: i + 1,
      description: l.description,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      tva,
      totalHT,
    };
  });

  const totals = computeTotals(lignesData);

  const devis = await prisma.devis.create({
    data: {
      userId: ctx.userId,
      clientId: data.clientId,
      numero,
      notes: data.notes,
      validUntil: data.validUntil,
      ...totals,
      lignes: { create: lignesData },
    },
    include: { lignes: true, client: true },
  });

  await logAudit(ctx, {
    action: "CREATE",
    entityType: "devis",
    entityId: devis.id,
    devisId: devis.id,
    metadata: { numero },
  });

  return devis;
}

export async function updateDevis(
  ctx: AuditContext,
  devisId: string,
  data: {
    lignes?: LigneInput[];
    notes?: string;
    validUntil?: Date | null;
  }
) {
  const existing = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
    include: { lignes: true },
  });

  if (!existing) throw new Error("Devis introuvable");
  assertDevisEditable(existing.status, existing.lockedAt);

  let updateData: Record<string, unknown> = {};

  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;

  if (data.lignes) {
    const lignesData = data.lignes.map((l, i) => {
      const tva = l.tva ?? 20;
      const totalHT = computeLineTotalHT(l.quantite, l.prixUnitaireHT);
      return {
        ordre: i + 1,
        description: l.description,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tva,
        totalHT,
      };
    });
    const totals = computeTotals(lignesData);
    updateData = { ...updateData, ...totals };

    await prisma.devisLigne.deleteMany({ where: { devisId } });
    await prisma.devisLigne.createMany({
      data: lignesData.map((l) => ({ ...l, devisId })),
    });
  }

  const devis = await prisma.devis.update({
    where: { id: devisId },
    data: updateData,
    include: { lignes: true, client: true },
  });

  await logAudit(ctx, {
    action: "UPDATE",
    entityType: "devis",
    entityId: devis.id,
    devisId: devis.id,
    metadata: { fields: Object.keys(data) },
  });

  return devis;
}

/** Verrouille le devis à l'envoi — hash + token de partage. */
export async function sendDevis(ctx: AuditContext, devisId: string) {
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
    include: { lignes: true, client: true },
  });

  if (!devis) throw new Error("Devis introuvable");
  if (devis.status !== "BROUILLON") {
    throw new ImmutabilityError("Seul un brouillon peut être envoyé.");
  }

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const payload = buildDevisPayload(devis, company);
  const contentHash = computeContentHash(payload);
  const chainHash = computeChainHash(contentHash, null);
  const shareToken = generateShareToken();
  const now = new Date();

  const updated = await prisma.devis.update({
    where: { id: devisId },
    data: {
      status: "ENVOYE",
      lockedAt: now,
      sentAt: now,
      contentHash,
      chainHash,
      shareToken,
    },
    include: { lignes: true, client: true },
  });

  await logAudit(ctx, {
    action: "LOCK",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash,
    metadata: { chainHash },
  });

  await logAudit(ctx, {
    action: "SEND",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash,
    metadata: { shareToken },
  });

  return updated;
}

export async function transitionDevisStatus(
  ctx: AuditContext,
  devisId: string,
  status: Extract<DevisStatus, "ACCEPTE" | "REFUSE">
) {
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
  });

  if (!devis) throw new Error("Devis introuvable");
  if (devis.status !== "ENVOYE") {
    throw new Error("Seul un devis envoyé peut être accepté ou refusé.");
  }

  const now = new Date();
  const updated = await prisma.devis.update({
    where: { id: devisId },
    data: {
      status,
      ...(status === "ACCEPTE" ? { acceptedAt: now } : { refusedAt: now }),
    },
    include: { lignes: true, client: true },
  });

  await logAudit(ctx, {
    action: status === "ACCEPTE" ? "ACCEPT" : "REFUSE",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash: devis.contentHash,
  });

  return updated;
}

export async function verifyDevisIntegrity(ctx: AuditContext, devisId: string) {
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId },
    include: { lignes: true, client: true },
  });

  if (!devis?.contentHash) {
    return { valid: false, reason: "Document non verrouillé" };
  }

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const payload = buildDevisPayload(devis, company);
  const valid = verifyDocumentIntegrity(devis.contentHash, payload);

  await logAudit(ctx, {
    action: "VERIFY_HASH",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash: devis.contentHash,
    metadata: { valid },
  });

  return { valid, contentHash: devis.contentHash, chainHash: devis.chainHash };
}

export async function softDeleteDevis(ctx: AuditContext, devisId: string) {
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
  });

  if (!devis) throw new Error("Devis introuvable");

  await prisma.devis.update({
    where: { id: devisId },
    data: { deletedAt: new Date() },
  });

  await logAudit(ctx, {
    action: "SOFT_DELETE",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash: devis.contentHash,
  });
}

export function getDevisStatusLabel(status: DevisStatus): string {
  const labels: Record<DevisStatus, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    ACCEPTE: "Accepté",
    REFUSE: "Refusé",
    FACTURE: "Facturé",
  };
  return labels[status];
}

export function getDevisStatusEmoji(status: DevisStatus): string {
  const emojis: Record<DevisStatus, string> = {
    BROUILLON: "📄",
    ENVOYE: "✈️",
    ACCEPTE: "✅",
    REFUSE: "❌",
    FACTURE: "💰",
  };
  return emojis[status];
}

export { isDevisLocked };
