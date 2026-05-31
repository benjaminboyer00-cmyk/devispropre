"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";

interface CookieConsentBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export function CookieConsentBanner({ onAccept, onReject }: CookieConsentBannerProps) {
  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-4 shadow-[0_-8px_32px_rgba(28,25,23,0.12)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p id="cookie-consent-title" className="heading text-sm font-semibold sm:text-base">
            Cookies et mesure d&apos;audience
          </p>
          <p id="cookie-consent-desc" className="text-body mt-1 text-sm leading-relaxed">
            Nous utilisons des cookies analytiques (Google Analytics via Tag Manager) pour améliorer
            le site. Les cookies strictement nécessaires au fonctionnement (connexion) restent actifs.
            {" "}
            <Link href={ROUTES.politiqueConfidentialite} className="link-underline font-medium">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <button type="button" onClick={onReject} className="ui-btn-outline px-4 py-2.5 text-sm">
            Refuser
          </button>
          <button type="button" onClick={onAccept} className="ui-btn-primary px-4 py-2.5 text-sm">
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
