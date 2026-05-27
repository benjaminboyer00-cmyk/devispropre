import type { Attestation, Client, Company, Facture, FactureLigne } from "@/generated/prisma/client";
import { prisma } from "../db";
import { ObjectStorageError, archivePdf, attestationPdfKey, readArchivedPdf } from "../object-storage";
import { generateAttestationPdf } from "../pdf-document";
import { ROUTES } from "../routes";

type FactureForAttestation = Facture & {
  client: Client;
  lignes: FactureLigne[];
  attestation: Attestation;
};

/** Sert l'attestation PDF archivée — backfill unique pour les émissions antérieures au stockage figé. */
export async function getArchivedAttestationPdf(
  userId: string,
  facture: FactureForAttestation,
  company: Company | null
): Promise<Buffer> {
  const { attestation } = facture;
  const key = attestationPdfKey(userId, facture.id);

  if (attestation.pdfArchivedAt) {
    const archived = await readArchivedPdf(key);
    if (archived) return archived;
    throw new ObjectStorageError("Archive attestation introuvable — contactez le support.");
  }

  const pdf = await generateAttestationPdf(attestation, facture, company);
  const apiPath = ROUTES.apiArchiveAttestation(facture.id);
  await archivePdf(key, pdf, apiPath);
  await prisma.attestation.update({
    where: { id: attestation.id },
    data: { pdfUrl: apiPath, pdfArchivedAt: new Date() },
  });
  return pdf;
}
