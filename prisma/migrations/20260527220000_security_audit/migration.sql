-- Snapshot émetteur figé à l'émission + blocage past_due Stripe
ALTER TABLE "User" ADD COLUMN "subscriptionPastDue" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Devis" ADD COLUMN "issuerSnapshot" JSONB;
ALTER TABLE "Facture" ADD COLUMN "issuerSnapshot" JSONB;
