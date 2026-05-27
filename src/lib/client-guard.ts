import { prisma } from "./db";

export class ClientArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientArchiveError";
  }
}

/** Bloque l'archivage d'un client lié à des factures émises (conservation 10 ans). */
export async function assertClientArchivable(userId: string, clientId: string): Promise<void> {
  const issuedFactures = await prisma.facture.count({
    where: {
      userId,
      clientId,
      deletedAt: null,
      status: { in: ["EMISE", "PAYEE"] },
    },
  });

  if (issuedFactures > 0) {
    throw new ClientArchiveError(
      "Impossible de supprimer ce client : des factures émises y sont rattachées (conservation légale 10 ans)."
    );
  }
}
