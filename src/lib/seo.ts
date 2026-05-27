import type { Metadata } from "next";

export const SITE = {
  name: "DevisPropre",
  url: "https://devispropre.fr",
  locale: "fr_FR",
  phone: "06 XX XX XX XX",
  description:
    "Devis et factures pour artisans en 2 minutes. PDF pro, envoi WhatsApp, conformité loi anti-fraude TVA 2018. À partir de 19€/mois, sans engagement.",
  tagline: "L'anti-usine à gaz de l'artisanat",
} as const;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "DevisPropre — Devis & factures pour artisans | devispropre.fr",
    template: "%s | DevisPropre",
  },
  description: SITE.description,
  keywords: [
    "devis artisan",
    "facture artisan",
    "logiciel devis BTP",
    "devis WhatsApp",
    "facturation artisan",
    "loi anti-fraude TVA 2018",
    "devis plombier",
    "devis électricien",
    "devis peintre",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: "DevisPropre — Devis pro en 2 minutes pour artisans",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "DevisPropre — Devis & factures pour artisans",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE.url,
  },
};

export function jsonLdSoftwareApplication() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Gratuit",
        price: "0",
        priceCurrency: "EUR",
        description: "3 devis par mois",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "19",
        priceCurrency: "EUR",
        description: "Devis illimités, WhatsApp, relances auto",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "39",
        priceCurrency: "EUR",
        description: "5 utilisateurs, statistiques avancées",
      },
    ],
    description: SITE.description,
    url: SITE.url,
  };
}

export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "French",
    },
  };
}
