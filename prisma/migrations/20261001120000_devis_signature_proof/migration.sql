-- Signature électronique : preuve (signataire, empreintes, PDF signé archivé)
ALTER TABLE "Devis" ADD COLUMN "signerName" TEXT;
ALTER TABLE "Devis" ADD COLUMN "signerEmail" TEXT;
ALTER TABLE "Devis" ADD COLUMN "signatureEvidence" JSONB;
ALTER TABLE "Devis" ADD COLUMN "signatureEvidenceHash" TEXT;
ALTER TABLE "Devis" ADD COLUMN "signedPdfHash" TEXT;
ALTER TABLE "Devis" ADD COLUMN "signedPdfArchivedAt" TIMESTAMP(3);

ALTER TABLE "DevisSignatureOtp" ADD COLUMN "email" TEXT;
