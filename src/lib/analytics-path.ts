import { sanitizePathForLog } from "./sanitize-log-path";

const SENSITIVE_PREFIXES = ["/devis/", "/facture/", "/api/public/"];

/** Pages dont le path contient un secret — pas d’analytics tiers. */
export function isAnalyticsSensitivePath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.includes("/api/auth/magic-link/verify")) return true;
  return SENSITIVE_PREFIXES.some((prefix) => {
    if (!pathname.startsWith(prefix)) return false;
    const rest = pathname.slice(prefix.length);
    return /^[a-f0-9]{64}$/.test(rest.split("/")[0] ?? "");
  });
}

export function analyticsPageUrl(origin: string, pathname: string, search = ""): string | null {
  if (isAnalyticsSensitivePath(pathname)) return null;
  const path = sanitizePathForLog(pathname);
  return search ? `${origin}${path}?${search}` : `${origin}${path}`;
}
