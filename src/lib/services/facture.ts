import type { FactureStatus } from "@/generated/prisma/client";
import { logAudit, type AuditContext } from "../audit";
import { generateAttestationNumero } from "../crypto";
import {
  buildFacturePayload,
  computeChainHash,
  computeContentHash,
  verifyDocumentIntegrity,
} from "../document-hash";
import { prisma } from "../db";
import { ForbiddenError } from "../errors";
import { assertFactureEditable, ImmutabilityError, isFactureLocked } from "../immutability";
import { assertStarterFeature } from "../plan-features";
import {
  computeLineTotalHT,
  computeTotals,
  nextFactureNumero,
} from "../numbers";
import {
  archivePdf,
  facturePdfKey,
  ObjectStorageError,
} from "../object-storage";
import { generateFacturePdf } from "../pdf-document";
import { ROUTES } from "../routes";

async function assertFacturationAllowed(userId: string) {
  const owner = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { plan: true },
  });
  if (!owner) throw new Error("Utilisateur introuvable");
  assertStarterFeature(owner.plan, "Facturation conforme TVA 2018");
}

export async function createFactureFromDevis(ctx: AuditContext, devisId: string) {
  await assertFacturationAllowed(ctx.userId);
  const devis = await prisma.devis.findFirst({
    where: { id: devisId, userId: ctx.userId, deletedAt: null },
    include: { lignes: true, client: true, facture: true },
  });

  if (!devis) throw new ForbiddenError("Devis introuvable ou non autorisé.");

  // Double vérification IDOR : le client du devis doit appartenir au même artisan
  const client = await prisma.client.findFirst({
    where: { id: devis.clientId, userId: ctx.userId, deletedAt: null },
  });
  if (!client) {
    throw new ForbiddenError("Client du devis non autorisé.");
  }
  if (devis.status !== "ACCEPTE") {
    throw new Error("Seul un devis accepté peut être converti en facture.");
  }
  if (devis.facture) throw new Error("Une facture existe déjà pour ce devis.");

  const numero = await nextFactureNumero(ctx.userId);

  const facture = await prisma.$transaction(async (tx) => {
    const created = await tx.facture.create({
      data: {
        userId: ctx.userId,
        clientId: devis.clientId,
        devisId: devis.id,
        numero,
        totalHT: devis.totalHT,
        totalTVA: devis.totalTVA,
        totalTTC: devis.totalTTC,
        tauxTVA: devis.tauxTVA,
        notes: devis.notes,
        lignes: {
          create: devis.lignes.map((l) => ({
            ordre: l.ordre,
            description: l.description,
            quantite: l.quantite,
            prixUnitaireHT: l.prixUnitaireHT,
            tva: l.tva,
            totalHT: l.totalHT,
          })),
        },
      },
      include: { lignes: true, client: true },
    });

    await tx.devis.update({
      where: { id: devisId },
      data: { status: "FACTURE" },
    });

    return created;
  });

  await logAudit(ctx, {
    action: "CONVERT_TO_FACTURE",
    entityType: "devis",
    entityId: devisId,
    devisId,
    factureId: facture.id,
    metadata: { factureNumero: numero },
  });

  await logAudit(ctx, {
    action: "CREATE",
    entityType: "facture",
    entityId: facture.id,
    factureId: facture.id,
    metadata: { numero, fromDevis: devisId },
  });

  return facture;
}

/** Émission = verrouillage définitif + chaînage hash (conformité TVA 2018). */
export async function issueFacture(ctx: AuditContext, factureId: string) {
  await assertFacturationAllowed(ctx.userId);
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: ctx.userId, deletedAt: null },
    include: { lignes: true, client: true },
  });

  if (!facture) throw new Error("Facture introuvable");
  if (facture.status !== "BROUILLON") {
    throw new ImmutabilityError("Seul un brouillon peut être émis.");
  }

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const payload = buildFacturePayload(facture, company);
  const contentHash = computeContentHash(payload);
  const now = new Date();

  const lastIssued = await prisma.facture.findFirst({
    where: {
      userId: ctx.userId,
      status: { in: ["EMISE", "PAYEE"] },
      contentHash: { not: null },
    },
    orderBy: { issuedAt: "desc" },
    select: { contentHash: true },
  });

  const previousHash = lastIssued?.contentHash ?? null;
  const chainHash = computeChainHash(contentHash, previousHash);

  const lockedForPdf = {
    ...facture,
    status: "EMISE" as const,
    lockedAt: now,
    issuedAt: now,
    contentHash,
    chainHash,
    previousHash,
  };

  let pdfUrl: string;
  try {
    const pdfBuffer = await generateFacturePdf(lockedForPdf, company);
    pdfUrl = await archivePdf(
      facturePdfKey(ctx.userId, factureId),
      pdfBuffer,
      ROUTES.apiArchiveFacture(factureId)
    );
  } catch (err) {
    if (err instanceof ObjectStorageError) throw err;
    throw new ObjectStorageError("Impossible d'archiver le PDF de la facture.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await tx.facture.updateMany({
      where: { id: factureId, userId: ctx.userId, status: "BROUILLON", deletedAt: null },
      data: {
        status: "EMISE",
        lockedAt: now,
        issuedAt: now,
        contentHash,
        chainHash,
        previousHash,
        pdfUrl,
        pdfArchivedAt: now,
      },
    });

    if (locked.count === 0) {
      throw new ImmutabilityError("Émission impossible — facture déjà émise ou introuvable.");
    }

    const attestationNumero = generateAttestationNumero(ctx.userId, facture.numero);
    await tx.attestation.create({
      data: {
        userId: ctx.userId,
        factureId,
        numero: attestationNumero,
        contentHash,
        signedAt: now,
      },
    });

    return tx.facture.findFirstOrThrow({
      where: { id: factureId },
      include: { lignes: true, client: true },
    });
  });

  await logAudit(ctx, {
    action: "LOCK",
    entityType: "facture",
    entityId: factureId,
    factureId,
    contentHash,
    metadata: { chainHash: updated.chainHash, previousHash: updated.previousHash, pdfUrl },
  });

  await logAudit(ctx, {
    action: "ISSUE",
    entityType: "facture",
    entityId: factureId,
    factureId,
    contentHash,
  });

  return updated;
}

export async function markFacturePaid(ctx: AuditContext, factureId: string) {
  await assertFacturationAllowed(ctx.userId);
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: ctx.userId, deletedAt: null },
  });

  if (!facture) throw new Error("Facture introuvable");
  if (facture.status !== "EMISE") {
    throw new Error("Seule une facture émise peut être marquée payée.");
  }

  const updated = await prisma.facture.update({
    where: { id: factureId },
    data: { status: "PAYEE", paidAt: new Date() },
    include: { lignes: true, client: true, attestation: true },
  });

  await logAudit(ctx, {
    action: "PAY",
    entityType: "facture",
    entityId: factureId,
    factureId,
    contentHash: facture.contentHash,
  });

  return updated;
}

export async function verifyFactureIntegrity(ctx: AuditContext, factureId: string) {
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: ctx.userId },
    include: { lignes: true, client: true },
  });

  if (!facture?.contentHash) {
    return { valid: false, reason: "Document non verrouillé" };
  }

  const company = await prisma.company.findUnique({ where: { userId: ctx.userId } });
  const payload = buildFacturePayload(facture, company);
  const valid = verifyDocumentIntegrity(facture.contentHash, payload);

  let chainValid = true;
  if (facture.previousHash) {
    chainValid = facture.chainHash === computeChainHash(facture.contentHash, facture.previousHash);
  }

  await logAudit(ctx, {
    action: "VERIFY_HASH",
    entityType: "facture",
    entityId: factureId,
    factureId,
    contentHash: facture.contentHash,
    metadata: { valid, chainValid },
  });

  return {
    valid: valid && chainValid,
    contentHash: facture.contentHash,
    chainHash: facture.chainHash,
    previousHash: facture.previousHash,
  };
}

export async function softDeleteFacture(ctx: AuditContext, factureId: string) {
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: ctx.userId, deletedAt: null },
  });

  if (!facture) throw new Error("Facture introuvable");
  if (isFactureLocked(facture.status, facture.lockedAt)) {
    throw new ImmutabilityError(
      "Une facture émise ne peut pas être supprimée (conservation légale)."
    );
  }

  await prisma.facture.update({
    where: { id: factureId },
    data: { deletedAt: new Date() },
  });

  await logAudit(ctx, {
    action: "SOFT_DELETE",
    entityType: "facture",
    entityId: factureId,
    factureId,
  });
}

export function getFactureStatusLabel(status: FactureStatus): string {
  const labels: Record<FactureStatus, string> = {
    BROUILLON: "Brouillon",
    EMISE: "Émise",
    PAYEE: "Payée",
    ANNULEE: "Annulée",
  };
  return labels[status];
}

export async function cancelFacture(ctx: AuditContext, factureId: string) {
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, userId: ctx.userId, deletedAt: null },
  });

  if (!facture) throw new Error("Facture introuvable");
  if (facture.status !== "BROUILLON") {
    throw new ImmutabilityError(
      "Seule une facture brouillon peut être annulée. Une facture émise reste archivée."
    );
  }

  const updated = await prisma.facture.update({
    where: { id: factureId },
    data: { status: "ANNULEE" },
    include: { lignes: true, client: true, attestation: true },
  });

  await logAudit(ctx, {
    action: "CANCEL",
    entityType: "facture",
    entityId: factureId,
    factureId,
    contentHash: facture.contentHash,
  });

  return updated;
}
