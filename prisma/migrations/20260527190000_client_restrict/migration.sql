-- Explicit Restrict on client relations (conservation légale factures/devis)
ALTER TABLE "Devis" DROP CONSTRAINT IF EXISTS "Devis_clientId_fkey";
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Facture" DROP CONSTRAINT IF EXISTS "Facture_clientId_fkey";
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
