/** Liens de partage client (WhatsApp, SMS, email) — sans données sensibles côté serveur. */
export function normalizePhone(phone: string | null | undefined): string {
  return phone?.replace(/\D/g, "") ?? "";
}

export function whatsAppShareHref(phone: string, message: string): string {
  const clean = normalizePhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function smsShareHref(phone: string, message: string): string {
  const clean = normalizePhone(phone);
  if (!clean) return "";
  return `sms:${clean}?body=${encodeURIComponent(message)}`;
}

export function mailShareHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Ouvre WhatsApp, mail, SMS… sans quitter la page DevisPropre. */
export function openShareHref(href: string): void {
  window.open(href, "_blank", "noopener,noreferrer");
}
