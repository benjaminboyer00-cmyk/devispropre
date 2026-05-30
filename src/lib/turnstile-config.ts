/** Config Turnstile lue au runtime (Docker / VPS). */
export function getTurnstilePublicConfig(): { enabled: boolean; siteKey: string } {
  const enforce = process.env.TURNSTILE_ENFORCE !== "false";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";

  const enabled = enforce && Boolean(siteKey && secretKey);

  return {
    enabled,
    siteKey: enabled ? siteKey : "",
  };
}
