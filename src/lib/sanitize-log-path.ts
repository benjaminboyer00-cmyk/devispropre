const SHARE_TOKEN_IN_PATH =
  /(\/(?:devis|facture|api\/public\/(?:devis|factures))\/)([a-f0-9]{64})(?=\/|$|\?)/gi;

const MAGIC_LINK_TOKEN = /([?&]token=)([A-Za-z0-9_-]+)/gi;

/** Masque les tokens sensibles avant écriture dans les logs (Nginx, app, alertes). */
export function sanitizePathForLog(path: string): string {
  return path
    .replace(SHARE_TOKEN_IN_PATH, "$1[REDACTED]")
    .replace(MAGIC_LINK_TOKEN, "$1[REDACTED]");
}
