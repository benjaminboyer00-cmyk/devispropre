-- Archivage PDF attestation figée à l'émission (conformité TVA 2018)
ALTER TABLE "Attestation" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Attestation" ADD COLUMN "pdfArchivedAt" TIMESTAMP(3);
