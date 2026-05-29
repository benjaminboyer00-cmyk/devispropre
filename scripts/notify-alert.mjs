#!/usr/bin/env node
/**
 * Envoie une alerte Slack / webhook générique (utilisable depuis les scripts bash VPS).
 * Usage: node scripts/notify-alert.mjs "Contexte" '{"key":"value"}'
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(resolve(root, ".env.production"));
loadEnvFile(resolve(root, ".env"));

const context = process.argv[2] ?? "Alerte DevisPropre";
let details = {};
if (process.argv[3]) {
  try {
    details = JSON.parse(process.argv[3]);
  } catch {
    details = { message: process.argv[3] };
  }
}

const url = process.env.ALERT_WEBHOOK_URL?.trim() || process.env.SLACK_WEBHOOK_URL?.trim();
const payload = { severity: "critical", context, ...details, ts: new Date().toISOString() };

console.error("[CRITICAL]", JSON.stringify(payload));

if (!url) {
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: `[CRITICAL] ${context}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*[CRITICAL] ${context}*\n\`\`\`${JSON.stringify(payload, null, 2).slice(0, 2800)}\`\`\``,
        },
      },
    ],
  }),
});

if (!res.ok) {
  console.error("[CRITICAL] Webhook HTTP", res.status);
  process.exit(1);
}
