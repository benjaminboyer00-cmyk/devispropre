-- AuditAction: REMINDER_SCHEDULED
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REMINDER_SCHEDULED';

-- Attestation: empêcher suppression cascade du document légal
ALTER TABLE "Attestation" DROP CONSTRAINT IF EXISTS "Attestation_factureId_fkey";
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_factureId_fkey"
  FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rate limit partagé multi-workers
CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- Numérotation atomique devis/factures
CREATE TABLE IF NOT EXISTS "DocumentCounter" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "docType" TEXT NOT NULL,
  "lastSeq" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentCounter_userId_year_docType_key"
  ON "DocumentCounter"("userId", "year", "docType");
