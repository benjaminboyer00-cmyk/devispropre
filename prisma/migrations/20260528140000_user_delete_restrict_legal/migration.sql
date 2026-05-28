-- Conservation légale : empêcher DELETE physique User si factures/attestations/audit existent
ALTER TABLE "Facture" DROP CONSTRAINT IF EXISTS "Facture_userId_fkey";
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attestation" DROP CONSTRAINT IF EXISTS "Attestation_userId_fkey";
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
