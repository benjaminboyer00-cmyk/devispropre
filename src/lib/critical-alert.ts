import { env } from "./env";
import { sanitizePathForLog } from "./sanitize-log-path";

type AlertSeverity = "critical" | "warning";

function emitAlert(severity: AlertSeverity, context: string, details: Record<string, unknown>): void {
  const payload = {
    severity,
    context,
    ...sanitizeDetails(details),
    ts: new Date().toISOString(),
  };
  const tag = severity === "critical" ? "[CRITICAL]" : "[WARNING]";
  console.error(tag, JSON.stringify(payload));
  void notifyAlertWebhook(payload, tag);
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === "string" && (key.includes("url") || key.includes("path") || key === "shareUrl")) {
      out[key] = sanitizePathForLog(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Alerte opérationnelle — Slack / webhook générique via variables d'environnement. */
export function logCriticalAlert(context: string, details: Record<string, unknown>): void {
  logOperationalAlert("critical", context, details);
}

/** Alerte warning ou critical (backup, relances, signature OTP, etc.). */
export function logOperationalAlert(
  severity: AlertSeverity,
  context: string,
  details: Record<string, unknown>
): void {
  emitAlert(severity, context, details);
}

async function notifyAlertWebhook(
  payload: Record<string, unknown>,
  tag: string
): Promise<void> {
  const url = env.alertWebhookUrl || env.slackWebhookUrl;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${tag} ${payload.context}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${tag} ${payload.context}*\n\`\`\`${JSON.stringify(payload, null, 2).slice(0, 2800)}\`\`\``,
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[ALERT] Échec envoi webhook alerte:", err);
  }
}
