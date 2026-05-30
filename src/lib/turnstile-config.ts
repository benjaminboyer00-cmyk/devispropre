/** Turnstile opt-in — actif uniquement si TURNSTILE_ENFORCE=true explicitement. */
export function isTurnstileEnforceRequested(): boolean {
  return process.env.TURNSTILE_ENFORCE === "true";
}

/** Config Turnstile lue au runtime (Docker / VPS). */
export function getTurnstilePublicConfig(): { enabled: boolean; siteKey: string } {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  const enabled = isTurnstileEnforceRequested() && Boolean(siteKey && secretKey);

  return {
    enabled,
    siteKey: enabled ? siteKey : "",
  };
}
