-- Assurance décennale structurée (mentions obligatoires BTP sur devis/factures)
ALTER TABLE "Company" ADD COLUMN "assuranceDecennaleAssureur" TEXT;
ALTER TABLE "Company" ADD COLUMN "assuranceDecennaleContrat" TEXT;
ALTER TABLE "Company" ADD COLUMN "assuranceDecennaleCouverture" TEXT;
