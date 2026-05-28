-- Permet de retraiter un webhook Stripe dont le traitement a échoué (processedAt NULL).
ALTER TABLE "StripeWebhookEvent" ADD COLUMN "processedAt" TIMESTAMP(3);
