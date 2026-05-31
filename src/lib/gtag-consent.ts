/** ID GA4 production — public, visible dans le HTML source. */
export const GA4_MEASUREMENT_ID = "G-KXV0LYVMEP";

/** Met à jour le Consent Mode GA4 (RGPD) via dataLayer. */
export function pushGtagConsentUpdate(granted: boolean): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push([
    "consent",
    "update",
    {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: granted ? "denied" : "denied",
      ad_user_data: granted ? "denied" : "denied",
      ad_personalization: granted ? "denied" : "denied",
    },
  ]);
}
