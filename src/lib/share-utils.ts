import { escapeHtml } from "./html-escape";

export interface DocumentShareMessage {
  beforeLink: string;
  linkWord: "devis" | "facture";
  afterLink: string;
  shareUrl: string;
}

export function buildDevisShareMessage(
  numero: string,
  clientName: string,
  shareUrl: string
): DocumentShareMessage {
  return {
    beforeLink: `Bonjour ${clientName},

Votre devis n° ${numero} est disponible en ligne :`,
    linkWord: "devis",
    afterLink: `

Merci de votre confiance !`,
    shareUrl,
  };
}

export function buildFactureShareMessage(
  numero: string,
  clientName: string,
  shareUrl: string
): DocumentShareMessage {
  return {
    beforeLink: `Bonjour ${clientName},

Votre facture n° ${numero} est disponible en ligne :`,
    linkWord: "facture",
    afterLink: `

Merci de votre confiance !`,
    shareUrl,
  };
}

/** Texte affiché / email plain — le mot devis|facture remplace l’URL visible. */
export function documentShareDisplayText(message: DocumentShareMessage): string {
  return `${message.beforeLink}\n${message.linkWord}${message.afterLink}`;
}

/** WhatsApp et SMS — URL complète (lien cliquable dans l’app). */
export function documentShareWhatsAppText(message: DocumentShareMessage): string {
  return `${message.beforeLink}\n${message.shareUrl}${message.afterLink}`;
}

/** @deprecated Utiliser documentShareWhatsAppText */
export function documentShareExternalText(message: DocumentShareMessage): string {
  return documentShareWhatsAppText(message);
}

/** Email HTML — le mot devis|facture est un lien cliquable. */
export function documentShareHtml(message: DocumentShareMessage): string {
  const before = escapeHtml(message.beforeLink).replace(/\n/g, "<br>");
  const after = escapeHtml(message.afterLink).replace(/\n/g, "<br>");
  const link = `<a href="${escapeHtml(message.shareUrl)}">${escapeHtml(message.linkWord)}</a>`;
  return `${before}<br>${link}${after}`;
}

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
