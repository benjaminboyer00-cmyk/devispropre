-- Index listes dashboard (tri createdAt desc par userId)
CREATE INDEX "Devis_userId_createdAt_idx" ON "Devis"("userId", "createdAt");
CREATE INDEX "Facture_userId_createdAt_idx" ON "Facture"("userId", "createdAt");
