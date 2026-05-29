-- Renommage logique shareToken -> shareTokenHash (colonne DB inchangée via @map)
-- Chiffrement owner + vérification email

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

UPDATE "User" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt") WHERE "emailVerifiedAt" IS NULL;

ALTER TABLE "Devis" ADD COLUMN IF NOT EXISTS "shareTokenEnc" TEXT;
ALTER TABLE "Facture" ADD COLUMN IF NOT EXISTS "shareTokenEnc" TEXT;
