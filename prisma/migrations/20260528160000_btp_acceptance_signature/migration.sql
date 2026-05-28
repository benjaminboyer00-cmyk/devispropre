-- Artisan BTP + acceptation client (signature numérique)
ALTER TABLE "Company" ADD COLUMN "activiteBtp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Devis" ADD COLUMN "clientAcceptanceText" TEXT;
ALTER TABLE "Devis" ADD COLUMN "clientSignatureData" TEXT;
