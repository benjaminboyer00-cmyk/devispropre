-- Sépare les jetons magic link et vérification email (évite l'invalidation croisée).
CREATE TYPE "AuthTokenPurpose" AS ENUM ('MAGIC_LINK', 'EMAIL_VERIFICATION');

ALTER TABLE "MagicLinkToken" ADD COLUMN "purpose" "AuthTokenPurpose" NOT NULL DEFAULT 'MAGIC_LINK';

DROP INDEX IF EXISTS "MagicLinkToken_userId_idx";
CREATE INDEX "MagicLinkToken_userId_purpose_idx" ON "MagicLinkToken"("userId", "purpose");
