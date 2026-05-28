/** Erreurs de réclamation brouillon invité — module minimal (évite imports lourds côté client). */
export const CLAIM_ERROR_KEY = "devispropre_claim_error";

export function saveClaimError(message: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAIM_ERROR_KEY, message);
}

export function loadClaimError(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CLAIM_ERROR_KEY);
}

export function clearClaimError(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLAIM_ERROR_KEY);
}
