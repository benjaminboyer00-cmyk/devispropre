import Script from "next/script";
import { getRequestNonce } from "@/lib/nonce";

/** Charge l'API Turnstile avec le nonce CSP — pages auth uniquement. */
export async function TurnstileScript({ siteKey }: { siteKey?: string }) {
  const key = siteKey?.trim();
  if (!key) return null;

  const nonce = await getRequestNonce();

  return (
    <Script
      id="cloudflare-turnstile"
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
