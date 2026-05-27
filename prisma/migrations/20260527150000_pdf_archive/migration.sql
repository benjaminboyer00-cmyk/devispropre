-- AlterTable
ALTER TABLE "Devis" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Devis" ADD COLUMN "pdfArchivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Facture" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Facture" ADD COLUMN "pdfArchivedAt" TIMESTAMP(3);
