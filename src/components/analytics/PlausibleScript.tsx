import { getRequestNonce } from "@/lib/nonce";
import { ANALYTICS } from "@/lib/analytics";

/** Script Plausible — mesure trafic SEO (pages, referrers, goals). */
export async function PlausibleScript() {
  const domain = ANALYTICS.plausibleDomain;
  if (!domain) return null;

  const nonce = await getRequestNonce();

  return (
    <script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.file-downloads.outbound-links.tagged-events.js"
      nonce={nonce ?? undefined}
    />
  );
}
