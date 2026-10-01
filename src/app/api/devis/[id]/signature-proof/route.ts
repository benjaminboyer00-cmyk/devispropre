import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { buildDevisPayload, verifyDocumentIntegrity } from "@/lib/document-hash";
import { readArchivedPdf, signedDevisPdfKey } from "@/lib/object-storage";
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
export async function GET(_request: NextRequest, { params }: RouteParams) {
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
    })),
  };

  return new Response(JSON.stringify(dossier, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="preuve-signature-${devis.numero}.json"`,
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
