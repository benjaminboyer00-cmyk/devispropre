/** Durée de validité par défaut d'un devis (usage BTP courant). */
export const DEVIS_VALIDITY_DAYS = 30;

/** Format YYYY-MM-DD en heure locale (évite le bug UTC de toISOString). */
export function formatDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInputValue(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d, 23, 59, 59, 999);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return undefined;
  }
  return date;
}

export function defaultValidUntilDate(from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 23, 59, 59, 999);
  d.setDate(d.getDate() + DEVIS_VALIDITY_DAYS);
  return d;
}

/** Valeur pour `<input type="date">` — calendrier local. */
export function defaultValidUntilInputValue(from = new Date()): string {
  return formatDateInputValue(defaultValidUntilDate(from));
}

export function validUntilToIso(value: string): string | undefined {
  return parseDateInputValue(value)?.toISOString();
}

/** Alias historique. */
export function parseValidUntilInput(value: string): Date | undefined {
  return parseDateInputValue(value);
}
