import { env } from "./env";

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
  return sendEmail({
    to: opts.clientEmail,
    subject: `Rappel — Devis ${opts.devisNumero} de ${opts.companyName}`,
    html: `
      <p>Bonjour ${opts.clientNom},</p>
      <p>Nous n'avons pas encore reçu votre réponse concernant le devis <strong>${opts.devisNumero}</strong> transmis par <strong>${opts.companyName}</strong>.</p>
      <p><a href="${opts.shareUrl}">Consulter et répondre au devis en ligne</a></p>
      <p style="color:#64748b;font-size:12px">Message automatique DevisPropre — relance J+3</p>
    `,
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

  return sendEmail({
    to: opts.artisanEmail,
    subject: `Relance J+3 envoyée — Devis ${opts.devisNumero} (${opts.clientNom})`,
    html: `
      <p>Bonjour ${opts.artisanName},</p>
      <p>Relance automatique J+3 pour le devis <strong>${opts.devisNumero}</strong> (${opts.clientNom}).</p>
      ${
        waLink
          ? `<p><a href="${waLink}">Ouvrir WhatsApp pour relancer le client</a></p>`
          : `<p><a href="${opts.shareUrl}">Lien du devis à partager</a></p>`
      }
      <p style="color:#64748b;font-size:12px">DevisPropre — relance automatique Starter+</p>
    `,
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
  return sendEmail({
    to: env.supportEmail,
    subject: `${prefix} ${opts.subject} — ${opts.userName}`,
    html: `
      <p><strong>Ticket #${opts.ticketId}</strong></p>
      <p>De : ${opts.userName} &lt;${opts.userEmail}&gt; — Plan ${opts.plan}</p>
      <p><strong>${opts.subject}</strong></p>
      <p>${opts.message.replace(/\n/g, "<br>")}</p>
    `,
  });
}

export async function sendTeamInviteEmail(opts: {
  inviteEmail: string;
  ownerName: string;
  companyName: string;
}): Promise<{ sent: boolean; reason?: string }> {
  return sendEmail({
    to: opts.inviteEmail,
    subject: `Invitation équipe DevisPropre — ${opts.companyName}`,
    html: `
      <p>Bonjour,</p>
      <p><strong>${opts.ownerName}</strong> vous invite à rejoindre l'équipe <strong>${opts.companyName}</strong> sur DevisPropre.</p>
      <p><a href="${env.appUrl}/inscription">Créer un compte</a> ou <a href="${env.appUrl}/connexion">vous connecter</a> avec cette adresse email pour accéder à l'espace partagé.</p>
    `,
  });
}
