"use client";

import { useEffect } from "react";
import { getStoredConsent } from "@/lib/cookie-consent";
import { pushGtagConsentUpdate } from "@/lib/gtag-consent";

/** Applique le consentement stocké au chargement (retour visiteur). */
export function GoogleAnalyticsConsentSync() {
  useEffect(() => {
    const stored = getStoredConsent();
    pushGtagConsentUpdate(stored === "all");
  }, []);

  return null;
}
