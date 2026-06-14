import Script from "next/script";
import { ANALYTICS } from "@/lib/analytics";

/** Google Tag Manager — head (production uniquement). */
export function GoogleTagManagerHead({ nonce }: { nonce?: string }) {
  const gtmId = ANALYTICS.gtmId;
  if (!gtmId) return null;

  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- root layout <head> (App Router), chargement avant hydratation
    <Script
      id="google-tag-manager"
      strategy="beforeInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
      }}
    />
  );
}

/** GTM noscript — juste après <body>. */
export function GoogleTagManagerBody() {
  const gtmId = ANALYTICS.gtmId;
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
