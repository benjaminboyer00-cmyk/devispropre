-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attestation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attestation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attestation_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attestation" ("contentHash", "createdAt", "factureId", "id", "numero", "signedAt", "userId") SELECT "contentHash", "createdAt", "factureId", "id", "numero", "signedAt", "userId" FROM "Attestation";
DROP TABLE "Attestation";
ALTER TABLE "new_Attestation" RENAME TO "Attestation";
CREATE UNIQUE INDEX "Attestation_factureId_key" ON "Attestation"("factureId");
CREATE UNIQUE INDEX "Attestation_numero_key" ON "Attestation"("numero");
CREATE INDEX "Attestation_userId_idx" ON "Attestation"("userId");
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "tvaIntracom" TEXT,
    "logoUrl" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "capitalSocial" TEXT,
    "rcs" TEXT,
    "assurances" TEXT,
    "tvaApplicable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("adresse", "assurances", "capitalSocial", "codePostal", "createdAt", "email", "id", "logoUrl", "raisonSociale", "rcs", "siret", "telephone", "tvaIntracom", "updatedAt", "userId", "ville") SELECT "adresse", "assurances", "capitalSocial", "codePostal", "createdAt", "email", "id", "logoUrl", "raisonSociale", "rcs", "siret", "telephone", "tvaIntracom", "updatedAt", "userId", "ville" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DevisLigne_devisId_idx" ON "DevisLigne"("devisId");

-- CreateIndex
CREATE INDEX "FactureLigne_factureId_idx" ON "FactureLigne"("factureId");
