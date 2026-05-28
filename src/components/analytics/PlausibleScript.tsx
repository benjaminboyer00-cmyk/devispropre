import Script from "next/script";
import { getRequestNonce } from "@/lib/nonce";

/** Script Plausible — actif uniquement si c'est le fournisseur principal. */
export async function PlausibleScript() {
  const { ANALYTICS, primaryAnalyticsProvider } = await import("@/lib/analytics");
  if (primaryAnalyticsProvider() !== "plausible" || !ANALYTICS.plausibleDomain) return null;

  const domain = ANALYTICS.plausibleDomain;

  const nonce = await getRequestNonce();

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.file-downloads.outbound-links.tagged-events.js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
