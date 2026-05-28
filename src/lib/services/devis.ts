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
import { assertCanCreateDevis, enforceFreeDevisQuotaInTransaction } from "../plan-limits";
import { computeLineTotalHT, computeTotals, nextDevisNumeroInTransaction } from "../numbers";
import { logCriticalAlert } from "../critical-alert";
import {
  archivePdf,
  deleteArchivedPdf,
  devisPdfKey,
  ObjectStorageError,
} from "../object-storage";
import { generateDevisPdf } from "../pdf-document";
import { assertBillingNotPastDue } from "../billing-status";
import { defaultValidUntilDate, parseValidUntilInput } from "../devis-defaults";
import { snapshotFromCompany, resolveIssuerCompany } from "../issuer-snapshot";
import { resolveLineTva, ensureFranchiseNotes } from "../tva";
import { ROUTES } from "../routes";

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
  },
  options?: { skipQuotaCheck?: boolean }
) {
  const user = await prisma.user.findFirst({
    where: { id: ctx.userId, deletedAt: null },
    select: { plan: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  await assertBillingNotPastDue(ctx.userId);
  if (!options?.skipQuotaCheck) {
    await assertCanCreateDevis(ctx.userId, user.plan);
  }

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const tvaApplicable = company?.tvaApplicable ?? true;

  const validUntil = data.validUntil ?? defaultValidUntilDate();

  const lignesData = data.lignes.map((l, i) => {
    const tva = resolveLineTva(l.tva, tvaApplicable);
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

  const devis = await prisma.$transaction(async (tx) => {
    if (!options?.skipQuotaCheck) {
      await enforceFreeDevisQuotaInTransaction(tx, ctx.userId, user.plan);
    }

    const client = await tx.client.findFirst({
      where: { id: data.clientId, userId: ctx.userId, deletedAt: null },
    });
    if (!client) {
      throw new ForbiddenError("Client introuvable ou non autorisé.");
    }

    const numero = await nextDevisNumeroInTransaction(tx, ctx.userId);

    return tx.devis.create({
      data: {
        userId: ctx.userId,
        clientId: data.clientId,
        numero,
        notes: ensureFranchiseNotes(data.notes, tvaApplicable),
        validUntil,
        ...totals,
        lignes: { create: lignesData },
      },
      include: { lignes: true, client: true },
    });
  });

  await logAudit(ctx, {
    action: "CREATE",
    entityType: "devis",
    entityId: devis.id,
    devisId: devis.id,
    metadata: { numero: devis.numero },
  });

  return devis;
}

/** Brouillon invité → client + devis sur le compte nouvellement créé. */
export async function claimGuestDraftAsDevis(
  ctx: AuditContext,
  draft: {
    clientNom: string;
    clientTelephone?: string;
    clientEmail?: string;
    clientAdresse?: string;
    lignes: LigneInput[];
    tvaApplicable?: boolean;
    validUntil?: string;
    notes?: string;
  }
) {
  const client = await prisma.client.create({
    data: {
      userId: ctx.userId,
      nom: draft.clientNom.trim(),
      telephone: draft.clientTelephone?.trim() || null,
      email: draft.clientEmail?.trim() || null,
      adresse: draft.clientAdresse?.trim() || null,
    },
  });

  if (draft.tvaApplicable === false) {
    await prisma.company.updateMany({
      where: { userId: ctx.userId },
      data: { tvaApplicable: false },
    });
  }

  return createDevis(
    ctx,
    {
      clientId: client.id,
      lignes: draft.lignes,
      notes: draft.notes?.trim() || undefined,
      validUntil: draft.validUntil ? parseValidUntilInput(draft.validUntil) : undefined,
    },
    { skipQuotaCheck: true }
  );
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
      const tva = resolveLineTva(l.tva, tvaApplicable);
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
  await assertBillingNotPastDue(ctx.userId);

  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
    include: { lignes: true, client: true },
  });

  if (!devis) throw new Error("Devis introuvable");
  if (devis.status !== "BROUILLON") {
    throw new ImmutabilityError("Seul un brouillon peut être envoyé.");
  }

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const issuerSnapshot = snapshotFromCompany(company);
  const payload = buildDevisPayload(devis, company);
  const contentHash = computeContentHash(payload);
  const chainHash = computeChainHash(contentHash, null);
  const shareToken = generateShareToken();
  const now = new Date();
  const issuerForPdf = resolveIssuerCompany(issuerSnapshot, company);

  const lockedForPdf = {
    ...devis,
    status: "ENVOYE" as const,
    lockedAt: now,
    sentAt: now,
    contentHash,
    chainHash,
    shareToken,
  };

  let pdfUrl: string;
  const pdfKey = devisPdfKey(ctx.userId, devisId);
  try {
    const pdfBuffer = await generateDevisPdf(lockedForPdf, issuerForPdf);
    pdfUrl = await archivePdf(pdfKey, pdfBuffer, ROUTES.apiArchiveDevis(devisId));
  } catch (err) {
    if (err instanceof ObjectStorageError) throw err;
    throw new ObjectStorageError("Impossible d'archiver le PDF du devis.");
  }

  try {
    const updated = await prisma.devis.update({
      where: { id: devisId },
      data: {
        status: "ENVOYE",
        lockedAt: now,
        sentAt: now,
        contentHash,
        chainHash,
        shareToken,
        pdfUrl,
        pdfArchivedAt: now,
        issuerSnapshot: issuerSnapshot ?? undefined,
      },
      include: { lignes: true, client: true },
    });

    await logAudit(ctx, {
      action: "LOCK",
      entityType: "devis",
      entityId: devisId,
      devisId,
      contentHash,
      metadata: { chainHash, pdfUrl },
    });

    await logAudit(ctx, {
      action: "SEND",
      entityType: "devis",
      entityId: devisId,
      devisId,
      contentHash,
      metadata: { channel: "whatsapp", pdfUrl },
    });

    return updated;
  } catch (err) {
    await deleteArchivedPdf(pdfKey);
    logCriticalAlert("Orphelin R2 après échec sendDevis", {
      devisId,
      userId: ctx.userId,
      pdfKey,
      error: String(err),
    });
    throw err;
  }
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
