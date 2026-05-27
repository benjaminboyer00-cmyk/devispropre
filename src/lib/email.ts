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

export async function sendDevisReminderEmail(opts: {
  artisanEmail: string;
  artisanName: string;
  devisNumero: string;
  clientNom: string;
  shareUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  return sendEmail({
    to: opts.artisanEmail,
    subject: `Relance J+3 — Devis ${opts.devisNumero} (${opts.clientNom})`,
    html: `
      <p>Bonjour ${opts.artisanName},</p>
      <p>Votre devis <strong>${opts.devisNumero}</strong> envoyé à <strong>${opts.clientNom}</strong> n'a pas encore reçu de réponse (J+3).</p>
      <p><a href="${opts.shareUrl}">Relancer le client via WhatsApp</a></p>
      <p style="color:#64748b;font-size:12px">DevisPropre — relance automatique</p>
    `,
  });
}
