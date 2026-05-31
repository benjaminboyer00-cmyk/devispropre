import { env } from "./env";
import { escapeHtml } from "./html-escape";
import { siteHostname } from "./seo";

const BRAND = {
  name: "DevisPropre",
  blue: "#1a3a5c",
  accent: "#d97706",
  background: "#f5f5f4",
  surface: "#ffffff",
  muted: "#78716c",
  border: "#e7e5e4",
} as const;

export function emailLogoUrl(): string {
  return `${env.appUrl.replace(/\/$/, "")}/icon.png`;
}

export interface BrandedEmailOptions {
  /** Texte invisible en prévisualisation boîte mail. */
  preheader?: string;
  title: string;
  greeting?: string;
  /** HTML du corps (paragraphes, listes — déjà échappé si contenu utilisateur). */
  bodyHtml: string;
  cta?: { label: string; href: string };
  /** Code OTP ou valeur mise en avant (ex. signature). */
  highlight?: string;
  footerNote?: string;
}

function emailButton(label: string, href: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0">
      <tr>
        <td style="border-radius:10px;background:${BRAND.blue}">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener"
            style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Template HTML responsive — compatible clients mail (tables inline). */
export function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const logoUrl = emailLogoUrl();
  const hostname = siteHostname();
  const preheader = opts.preheader ?? opts.title;
  const greeting = opts.greeting ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1c1917">${opts.greeting}</p>` : "";
  const highlight = opts.highlight
    ? `<p style="margin:20px 0;font-size:32px;font-weight:700;letter-spacing:0.18em;font-family:ui-monospace,Consolas,monospace;color:${BRAND.blue};text-align:center">${escapeHtml(opts.highlight)}</p>`
    : "";
  const cta = opts.cta ? emailButton(opts.cta.label, opts.cta.href) : "";
  const footerNote = opts.footerNote
    ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${BRAND.muted}">${opts.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.background}">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${BRAND.surface};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};box-shadow:0 4px 24px rgba(28,25,23,0.06)">
          <tr>
            <td align="center" style="background:${BRAND.blue};padding:28px 24px">
              <img src="${escapeHtml(logoUrl)}" alt="DevisPropre" width="52" height="52" style="display:block;border-radius:12px;margin:0 auto">
              <p style="margin:14px 0 0;font-size:22px;font-weight:700;line-height:1.2">
                <span style="color:#ffffff">Devis</span><span style="color:${BRAND.accent}">Propre</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px">
              <h1 style="margin:0 0 20px;font-size:22px;line-height:1.35;color:#1c1917;font-weight:700">${escapeHtml(opts.title)}</h1>
              ${greeting}
              <div style="font-size:16px;line-height:1.65;color:#57534e">${opts.bodyHtml}</div>
              ${highlight}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 24px;background:#fafaf9;border-top:1px solid ${BRAND.border};text-align:center">
              ${footerNote}
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted}">
                ${BRAND.name} · <a href="${escapeHtml(env.appUrl)}" style="color:${BRAND.blue};text-decoration:none">${hostname}</a><br>
                Devis et factures pour artisans — conforme TVA 2018
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Paragraphe email avec texte échappé. */
export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px">${escapeHtml(text)}</p>`;
}

/** Lien inline dans un email. */
export function emailLink(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${BRAND.blue};font-weight:600;text-decoration:underline">${escapeHtml(label)}</a>`;
}
