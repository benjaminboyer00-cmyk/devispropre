/** Consentement cookies — localStorage (pas de cookie HTTP pour éviter le paradoxe RGPD). */

export const COOKIE_CONSENT_KEY = "dp-cookie-consent";
export const COOKIE_CONSENT_EVENT = "dp-cookie-consent";
export const COOKIE_CONSENT_OPEN_EVENT = "dp-cookie-consent-open";

export type CookieConsentValue = "all" | "essential";

export function getStoredConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === "all" || value === "essential" ? value : null;
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "all";
}

export function setStoredConsent(value: CookieConsentValue): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}
