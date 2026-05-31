import { env } from "./env";
import {
  emailLink,
  emailParagraph,
  renderBrandedEmail,
} from "./email-template";
import { escapeHtml } from "./html-escape";
import { documentShareHtml } from "./share-utils";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/** Envoi email via Resend (fetch natif, pas de dépendance). */
export async function sendEmail(params: SendEmailParams): Promise<{ sent: boolean; reason?: string }> {
  if (!env.resendApiKey) {
    return { sent: false, reason: "RESEND_API_KEY non configurée" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.resendFromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { sent: false, reason: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }

  return { sent: true };
}

function whatsAppLink(phone: string | null | undefined, message: string): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function sendDevisReminderToClient(opts: {
  clientEmail: string;
  clientNom: string;
  artisanName: string;
  companyName: string;
  devisNumero: string;
  shareUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const bodyHtml = documentShareHtml({
    beforeLink: `Bonjour ${opts.clientNom},

Nous n'avons pas encore reçu votre réponse concernant le devis n° ${opts.devisNumero} transmis par ${opts.companyName}.`,
    linkWord: "devis",
    afterLink: `

Merci de votre confiance !`,
    shareUrl: opts.shareUrl,
  });

  return sendEmail({
    to: opts.clientEmail,
    subject: `Rappel — Devis ${escapeHtml(opts.devisNumero)} de ${escapeHtml(opts.companyName)}`,
    html: renderBrandedEmail({
      preheader: `Rappel devis ${opts.devisNumero} — ${opts.companyName}`,
      title: `Rappel — devis n° ${opts.devisNumero}`,
      bodyHtml,
      footerNote: "Message automatique DevisPropre — relance J+3",
    }),
  });
}

export async function sendDevisReminderEmail(opts: {
  artisanEmail: string;
  artisanName: string;
  devisNumero: string;
  clientNom: string;
  clientPhone?: string | null;
  shareUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const waMsg = `Bonjour, je me permets de relancer concernant le devis ${opts.devisNumero}. Vous pouvez le consulter ici : ${opts.shareUrl}`;
  const waLink = whatsAppLink(opts.clientPhone, waMsg);

  const bodyHtml = `
    ${emailParagraph(`Relance automatique J+3 pour le devis n° ${opts.devisNumero} (${opts.clientNom}).`)}
    ${
      waLink
        ? `<p style="margin:0">${emailLink("Ouvrir WhatsApp pour relancer le client", waLink)}</p>`
        : `<p style="margin:0">${emailLink("Lien du devis à partager", opts.shareUrl)}</p>`
    }`;

  return sendEmail({
    to: opts.artisanEmail,
    subject: `Relance J+3 envoyée — Devis ${escapeHtml(opts.devisNumero)} (${escapeHtml(opts.clientNom)})`,
    html: renderBrandedEmail({
      preheader: `Relance J+3 — devis ${opts.devisNumero}`,
      title: "Relance client envoyée",
      greeting: `Bonjour ${escapeHtml(opts.artisanName)},`,
      bodyHtml,
      footerNote: "DevisPropre — relance automatique Starter+",
    }),
  });
}

export async function sendSupportTicketEmail(opts: {
  userEmail: string;
  userName: string;
  plan: string;
  subject: string;
  message: string;
  priority: boolean;
  ticketId: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const prefix = opts.priority ? "[PRO PRIORITAIRE]" : "[Support]";
  const bodyHtml = `
    ${emailParagraph(`Ticket #${opts.ticketId}`)}
    <p style="margin:0 0 16px">De : <strong>${escapeHtml(opts.userName)}</strong> &lt;${escapeHtml(opts.userEmail)}&gt;<br>Plan ${escapeHtml(opts.plan)}</p>
    <p style="margin:0 0 8px;font-weight:600;color:#1c1917">${escapeHtml(opts.subject)}</p>
    <p style="margin:0;white-space:pre-wrap">${escapeHtml(opts.message)}</p>`;

  return sendEmail({
    to: env.supportEmail,
    subject: `${prefix} ${escapeHtml(opts.subject)} — ${escapeHtml(opts.userName)}`,
    html: renderBrandedEmail({
      title: opts.subject,
      bodyHtml,
      footerNote: `Ticket support #${opts.ticketId}`,
    }),
  });
}

export async function sendTeamInviteEmail(opts: {
  inviteEmail: string;
  ownerName: string;
  companyName: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const bodyHtml = `
    ${emailParagraph(`${opts.ownerName} vous invite à rejoindre l'équipe ${opts.companyName} sur DevisPropre.`)}
    ${emailParagraph("Créez un compte ou connectez-vous avec cette adresse email pour accéder à l'espace partagé.")}`;

  return sendEmail({
    to: opts.inviteEmail,
    subject: `Invitation équipe DevisPropre — ${opts.companyName}`,
    html: renderBrandedEmail({
      preheader: `Invitation équipe ${opts.companyName}`,
      title: "Invitation à rejoindre une équipe",
      greeting: "Bonjour,",
      bodyHtml,
      cta: { label: "Créer mon compte", href: `${env.appUrl}/inscription` },
      footerNote: `Vous avez déjà un compte ? ${emailLink("Se connecter", `${env.appUrl}/connexion`)}`,
    }),
  });
}

export async function sendMagicLinkEmail(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  return sendEmail({
    to: opts.to,
    subject: "Votre lien de connexion DevisPropre",
    html: renderBrandedEmail({
      preheader: "Connectez-vous à DevisPropre en un clic — lien valable 15 minutes",
      title: "Connexion à votre compte",
      greeting: `Bonjour ${escapeHtml(opts.name)},`,
      bodyHtml: emailParagraph(
        "Cliquez sur le bouton ci-dessous pour vous connecter sans mot de passe. Vous serez redirigé directement vers votre tableau de bord. Ce lien expire dans 15 minutes."
      ),
      cta: { label: "Se connecter", href: opts.verifyUrl },
      footerNote: "Si vous n'avez pas demandé ce lien, ignorez cet email.",
    }),
  });
}

export async function sendEmailVerificationEmail(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  return sendEmail({
    to: opts.to,
    subject: "Confirmez votre email — DevisPropre",
    html: renderBrandedEmail({
      preheader: "Confirmez votre adresse email pour activer votre compte DevisPropre",
      title: "Confirmez votre adresse email",
      greeting: `Bonjour ${escapeHtml(opts.name)},`,
      bodyHtml: `
        ${emailParagraph("Merci pour votre inscription sur DevisPropre.")}
        ${emailParagraph("Confirmez votre adresse email pour activer votre compte et accéder à vos devis, factures et relances automatiques.")}
        ${emailParagraph("Ce lien est valable 24 h. Après confirmation, vous serez connecté automatiquement.")}`,
      cta: { label: "Confirmer mon email", href: opts.verifyUrl },
      footerNote: "Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet email.",
    }),
  });
}

export async function sendFactureLinkEmail(opts: {
  to: string;
  clientNom: string;
  companyName: string;
  factureNumero: string;
  shareUrl: string;
  resend?: boolean;
}): Promise<{ sent: boolean; reason?: string }> {
  const subject = opts.resend
    ? `Rappel — Facture ${opts.factureNumero} de ${opts.companyName}`
    : `Facture ${opts.factureNumero} — ${opts.companyName}`;

  const intro = opts.resend
    ? `Voici à nouveau votre facture n° ${opts.factureNumero} de ${opts.companyName} :`
    : `Votre facture n° ${opts.factureNumero} de ${opts.companyName} est disponible en ligne :`;

  const bodyHtml = documentShareHtml({
    beforeLink: `Bonjour ${opts.clientNom},

${intro}`,
    linkWord: "facture",
    afterLink: `

Merci de votre confiance !`,
    shareUrl: opts.shareUrl,
  });

  return sendEmail({
    to: opts.to,
    subject,
    html: renderBrandedEmail({
      preheader: `${opts.resend ? "Rappel — " : ""}Facture ${opts.factureNumero} — ${opts.companyName}`,
      title: opts.resend ? `Rappel — facture n° ${opts.factureNumero}` : `Facture n° ${opts.factureNumero}`,
      bodyHtml,
      footerNote: "Document transmis via DevisPropre.",
    }),
  });
}

export async function sendDevisSignatureOtpEmail(opts: {
  to: string;
  clientNom: string;
  devisNumero: string;
  companyName: string;
  code: string;
  expiresMinutes: number;
}): Promise<{ sent: boolean; reason?: string }> {
  return sendEmail({
    to: opts.to,
    subject: `Code de signature — Devis ${escapeHtml(opts.devisNumero)}`,
    html: renderBrandedEmail({
      preheader: `Code de signature devis ${opts.devisNumero}`,
      title: "Code de signature du devis",
      greeting: `Bonjour ${escapeHtml(opts.clientNom)},`,
      bodyHtml: emailParagraph(
        `Pour signer le devis n° ${opts.devisNumero} de ${opts.companyName}, saisissez ce code sur la page du devis :`
      ),
      highlight: opts.code,
      footerNote: `Ce code expire dans ${opts.expiresMinutes} minutes. Ne le partagez avec personne.`,
    }),
  });
}
