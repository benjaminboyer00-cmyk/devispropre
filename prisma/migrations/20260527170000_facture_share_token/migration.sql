-- AlterTable
ALTER TABLE "Facture" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Facture_shareToken_key" ON "Facture"("shareToken");

-- Backfill tokens for already-issued invoices (WhatsApp sharing)
UPDATE "Facture"
SET "shareToken" = md5(random()::text || id || clock_timestamp()::text) || md5(id || random()::text)
WHERE "shareToken" IS NULL AND status IN ('EMISE', 'PAYEE');
