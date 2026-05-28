-- CreateTable
CREATE TABLE "DevisSignatureOtp" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevisSignatureOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevisSignatureOtp_devisId_usedAt_expiresAt_idx" ON "DevisSignatureOtp"("devisId", "usedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "DevisSignatureOtp" ADD CONSTRAINT "DevisSignatureOtp_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
