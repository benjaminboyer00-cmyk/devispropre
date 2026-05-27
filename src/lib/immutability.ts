import type { DevisStatus, FactureStatus } from "@/generated/prisma/client";

/** Devis verrouillé dès l'envoi — plus aucune modification de contenu. */
export function isDevisLocked(status: DevisStatus, lockedAt: Date | null): boolean {
  return lockedAt !== null || status !== "BROUILLON";
}

/** Facture verrouillée dès l'émission — conformité anti-fraude TVA. */
export function isFactureLocked(status: FactureStatus, lockedAt: Date | null): boolean {
  return lockedAt !== null || status === "EMISE" || status === "PAYEE";
}

export class ImmutabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImmutabilityError";
  }
}

export function assertDevisEditable(
  status: DevisStatus,
  lockedAt: Date | null
): void {
  if (isDevisLocked(status, lockedAt)) {
    throw new ImmutabilityError(
      "Ce devis est verrouillé. Les données ne peuvent plus être modifiées (conformité légale)."
    );
  }
}

export function assertFactureEditable(
  status: FactureStatus,
  lockedAt: Date | null
): void {
  if (isFactureLocked(status, lockedAt)) {
    throw new ImmutabilityError(
      "Cette facture est verrouillée. Les données ne peuvent plus être modifiées (loi anti-fraude TVA 2018)."
    );
  }
}

/** Champs autorisés après verrouillage (transitions d'état uniquement). */
export const DEVIS_POST_LOCK_FIELDS = new Set([
  "status",
  "acceptedAt",
  "refusedAt",
  "reminderSentAt",
  "deletedAt",
]);

export const FACTURE_POST_LOCK_FIELDS = new Set([
  "status",
  "paidAt",
  "deletedAt",
]);
