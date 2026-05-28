/** Formate l'heure de sauvegarde d'un brouillon invité (localStorage). */
export function formatDraftSavedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}
