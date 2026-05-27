import { env } from "./env";

/** Alerte opérationnelle — Slack / webhook générique via variables d'environnement. */
export function logCriticalAlert(context: string, details: Record<string, unknown>): void {
  const payload = { context, ...details, ts: new Date().toISOString() };
  console.error("[CRITICAL]", JSON.stringify(payload));
  void notifyAlertWebhook(payload);
}

async function notifyAlertWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = env.alertWebhookUrl || env.slackWebhookUrl;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[CRITICAL] ${payload.context}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${payload.context}*\n\`\`\`${JSON.stringify(payload, null, 2).slice(0, 2800)}\`\`\``,
            },
          },
        ],
        ...payload,
      }),
    });
  } catch (err) {
    console.error("[CRITICAL] Échec envoi webhook alerte:", err);
  }
}
