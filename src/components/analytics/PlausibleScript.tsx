import Script from "next/script";
import { ANALYTICS } from "@/lib/analytics";
import { getRequestNonce } from "@/lib/nonce";

/** Script Plausible — mesure trafic SEO (pages, referrers, goals). */
export async function PlausibleScript() {
  const domain = ANALYTICS.plausibleDomain;
  if (!domain) return null;

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
