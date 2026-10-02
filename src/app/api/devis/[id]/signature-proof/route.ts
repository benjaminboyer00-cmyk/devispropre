import { NextRequest } from "next/server";
import { getRequestMeta, requireAuth } from "@/lib/api-helpers";
import { logAudit, verifyWorkspaceAuditChain } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildDevisPayload, verifyDocumentIntegrity } from "@/lib/document-hash";
import { readArchivedPdf, signedDevisPdfKey } from "@/lib/object-storage";
import { contentDisposition } from "@/lib/pdf-response";
import {
  isSignatureEvidence,
  sha256Buffer,
  signatureImageSha256,
  verifySignatureEvidence,
} from "@/lib/signature-evidence";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Dossier de preuve de la signature électronique (JSON téléchargeable) :
 * données de preuve, empreintes recalculées et journal d'audit du devis.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null, signatureEvidenceHash: { not: null } },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      client: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!devis || !isSignatureEvidence(devis.signatureEvidence) || !devis.signatureEvidenceHash) {
    return Response.json({ error: "Aucune signature électronique pour ce devis" }, { status: 404 });
  }

  const evidence = devis.signatureEvidence;
  const company = await prisma.company.findUnique({ where: { userId: auth.workspaceUserId } });
  const payload = buildDevisPayload(devis, company);
  const signedPdf = await readArchivedPdf(signedDevisPdfKey(auth.workspaceUserId, devis.id));
  const auditChain = await verifyWorkspaceAuditChain(auth.workspaceUserId);

  const checks = {
    evidenceHashValid: verifySignatureEvidence(evidence, devis.signatureEvidenceHash),
    devisContentUnchanged:
      Boolean(devis.contentHash) &&
      devis.contentHash === evidence.contentHash &&
      verifyDocumentIntegrity(devis.contentHash!, payload),
    signatureImageUnchanged:
      Boolean(devis.clientSignatureData) &&
      signatureImageSha256(devis.clientSignatureData!) === evidence.signatureImageSha256,
    signedPdfUnchanged: signedPdf ? sha256Buffer(signedPdf) === devis.signedPdfHash : null,
    /** Chaîne d'audit de l'espace complète (les entrées du devis en font partie). */
    auditChainValid: auditChain.valid,
  };

  const dossier = {
    format: "devispropre-signature-proof",
    generatedAt: new Date().toISOString(),
    legalBasis:
      "Signature électronique simple — règlement (UE) n° 910/2014 (eIDAS) art. 25 ; Code civil art. 1366-1367.",
    devis: {
      id: devis.id,
      numero: devis.numero,
      status: devis.status,
      totalTTC: devis.totalTTC,
      sentAt: devis.sentAt?.toISOString() ?? null,
      acceptedAt: devis.acceptedAt?.toISOString() ?? null,
      contentHash: devis.contentHash,
    },
    evidence,
    hashes: {
      signatureEvidenceHash: devis.signatureEvidenceHash,
      signedPdfHash: devis.signedPdfHash,
      algorithm: "SHA-256 (hex) ; preuve = SHA-256 de la sérialisation canonique (clés triées) de `evidence`",
    },
    checks,
    auditTrail: devis.auditLogs.map((log) => ({
      action: log.action,
      at: log.createdAt.toISOString(),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      contentHash: log.contentHash,
      metadata: safeParse(log.metadata),
      seq: log.seq,
      prevHash: log.prevHash,
      entryHash: log.entryHash,
    })),
    auditChain,
  };

  await logAudit(
    { userId: auth.workspaceUserId, actorUserId: auth.user.id, ...getRequestMeta(request) },
    {
      action: "EXPORT_PROOF",
      entityType: "Devis",
      entityId: devis.id,
      devisId: devis.id,
      metadata: { artifact: "signature_proof" },
    }
  );

  return new Response(JSON.stringify(dossier, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": contentDisposition("attachment", `preuve-signature-${devis.numero}.json`),
      "Cache-Control": "private, no-store",
    },
  });
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
