-- Index cron relances J+3
CREATE INDEX "Devis_status_sentAt_reminderSentAt_idx" ON "Devis"("status", "sentAt", "reminderSentAt");
