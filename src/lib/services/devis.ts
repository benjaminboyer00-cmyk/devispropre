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
import { assertDevisEditable, ImmutabilityError } from "../immutability";
import { ForbiddenError } from "../errors";
import { assertCanCreateDevis } from "../plan-limits";
import { computeLineTotalHT, computeTotals, nextDevisNumero } from "../numbers";

export interface LigneInput {
  description: string;
  quantite: number;
  prixUnitaireHT: number;
  tva?: number;
}

async function assertClientOwnership(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });
  if (!client) {
    throw new ForbiddenError("Client introuvable ou non autorisé.");
  }
  return client;
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
  const user = await prisma.user.findFirst({
    where: { id: ctx.userId, deletedAt: null },
    select: { plan: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  await assertCanCreateDevis(ctx.userId, user.plan);
  await assertClientOwnership(ctx.userId, data.clientId);

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const tvaApplicable = company?.tvaApplicable ?? true;

  const numero = await nextDevisNumero(ctx.userId);
  const lignesData = data.lignes.map((l, i) => {
    const tva = tvaApplicable ? (l.tva ?? 20) : 0;
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

  const totals = computeTotals(lignesData, tvaApplicable);

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

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const tvaApplicable = company?.tvaApplicable ?? true;

  let updateData: Record<string, unknown> = {};
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;

  let lignesData:
    | {
        ordre: number;
        description: string;
        quantite: number;
        prixUnitaireHT: number;
        tva: number;
        totalHT: number;
      }[]
    | undefined;

  if (data.lignes) {
    lignesData = data.lignes.map((l, i) => {
      const tva = tvaApplicable ? (l.tva ?? 20) : 0;
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
    updateData = { ...updateData, ...computeTotals(lignesData, tvaApplicable) };
  }

  const devis = await prisma.$transaction(async (tx) => {
    if (lignesData) {
      await tx.devisLigne.deleteMany({ where: { devisId } });
      await tx.devisLigne.createMany({
        data: lignesData.map((l) => ({ ...l, devisId })),
      });
    }

    return tx.devis.update({
      where: { id: devisId },
      data: updateData,
      include: { lignes: { orderBy: { ordre: "asc" } }, client: true },
    });
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
    metadata: { channel: "whatsapp" },
  });

  return updated;
}

/** Transition publique via shareToken — ownership explicite anti-IDOR. */
export async function transitionDevisStatusFromPublic(
  ctx: AuditContext,
  devisId: string,
  shareToken: string,
  status: Extract<DevisStatus, "ACCEPTE" | "REFUSE">
) {
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, shareToken, deletedAt: null, status: "ENVOYE" },
  });

  if (!devis) {
    throw new Error("Ce devis a déjà été traité ou n'est plus disponible.");
  }

  const now = new Date();
  const result = await prisma.devis.updateMany({
    where: { id: devisId, userId: ctx.userId, shareToken, status: "ENVOYE", deletedAt: null },
    data: {
      status,
      ...(status === "ACCEPTE" ? { acceptedAt: now } : { refusedAt: now }),
    },
  });

  if (result.count === 0) {
    throw new Error("Ce devis a déjà été traité ou n'est plus disponible.");
  }

  const updated = await prisma.devis.findFirst({
    where: { id: devisId },
    include: { lignes: true, client: true },
  });

  await logAudit(ctx, {
    action: status === "ACCEPTE" ? "ACCEPT" : "REFUSE",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash: devis.contentHash,
    metadata: { via: "public_share_token" },
  });

  return updated!;
}

/** Transition atomique — évite la double acceptation (race condition). */
export async function transitionDevisStatus(
  ctx: AuditContext,
  devisId: string,
  status: Extract<DevisStatus, "ACCEPTE" | "REFUSE">
) {
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
  });

  if (!devis) throw new Error("Devis introuvable");

  const now = new Date();
  const result = await prisma.devis.updateMany({
    where: { id: devisId, userId: ctx.userId, status: "ENVOYE", deletedAt: null },
    data: {
      status,
      ...(status === "ACCEPTE" ? { acceptedAt: now } : { refusedAt: now }),
    },
  });

  if (result.count === 0) {
    throw new Error("Ce devis a déjà été traité ou n'est plus disponible.");
  }

  const updated = await prisma.devis.findFirst({
    where: { id: devisId },
    include: { lignes: true, client: true },
  });

  await logAudit(ctx, {
    action: status === "ACCEPTE" ? "ACCEPT" : "REFUSE",
    entityType: "devis",
    entityId: devisId,
    devisId,
    contentHash: devis.contentHash,
  });

  return updated!;
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

  const linkedFacture = await prisma.facture.findFirst({
    where: { devisId, userId: ctx.userId, deletedAt: null },
    select: { id: true },
  });

  if (devis.status === "FACTURE" || linkedFacture) {
    throw new ImmutabilityError(
      "Impossible de supprimer un devis déjà converti en facture."
    );
  }

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
