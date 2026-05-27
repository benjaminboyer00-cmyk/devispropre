import type { Metadata } from "next";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://devispropre.fr"
);

export const SITE = {
  name: "DevisPropre",
  url: APP_URL,
  locale: "fr_FR",
  phone: "06 60 61 48 39",
  phoneRaw: "33660614839",
  owner: "Benjamin Boyer",
  email: "contact@devispropre.fr",
  description:
    "Logiciel de devis et factures pour artisans du BTP. PDF conforme, envoi WhatsApp, loi anti-fraude TVA 2018. Plombier, électricien, peintre — dès 19€/mois.",
  tagline: "L'anti-usine à gaz de l'artisanat",
} as const;

export const KEYWORDS = [
  "devis artisan",
  "facture artisan",
  "logiciel devis BTP",
  "devis WhatsApp",
  "facturation artisan",
  "loi anti-fraude TVA 2018",
  "devis plombier",
  "devis électricien",
  "devis peintre",
  "devis pro artisan",
  "facture conforme TVA",
] as const;

/** Image OG dynamique (app/opengraph-image.tsx) — WhatsApp, Facebook, Twitter. */
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "DevisPropre — Devis et factures pour artisans du BTP",
} as const;

const sharedSocial = {
  images: [OG_IMAGE],
};

/** Metadata réutilisable par page marketing. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE.url}${opts.path}`;
  const ogTitle = `${opts.title} | ${SITE.name}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords ?? [...KEYWORDS],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: ogTitle,
      description: opts.description,
      ...sharedSocial,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: opts.description,
      ...sharedSocial,
    },
  };
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Devis et factures pour artisans en 2 minutes | DevisPropre",
    template: "%s | DevisPropre",
  },
  description: SITE.description,
  keywords: [...KEYWORDS],
  authors: [{ name: SITE.owner, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Business",
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: "Devis et factures pour artisans en 2 minutes | DevisPropre",
    description: SITE.description,
    ...sharedSocial,
  },
  twitter: {
    card: "summary_large_image",
    title: "Devis et factures pour artisans | DevisPropre",
    description: SITE.description,
    ...sharedSocial,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE.url },
};

export function jsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

export function jsonLdSoftwareApplication() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR", url: `${SITE.url}/tarifs` },
      { "@type": "Offer", name: "Starter", price: "19", priceCurrency: "EUR", url: `${SITE.url}/tarifs` },
      { "@type": "Offer", name: "Pro", price: "39", priceCurrency: "EUR", url: `${SITE.url}/tarifs` },
    ],
    description: SITE.description,
    url: SITE.url,
    author: { "@type": "Person", name: SITE.owner },
  };
}

export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    email: SITE.email,
    founder: { "@type": "Person", name: SITE.owner },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+${SITE.phoneRaw}`,
      email: SITE.email,
      availableLanguage: "French",
    },
  };
}

export function jsonLdFaq() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "DevisPropre est-il conforme à la loi anti-fraude TVA 2018 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. Verrouillage des factures, empreinte SHA-256, chaînage et attestation individuelle.",
        },
      },
      {
        "@type": "Question",
        name: "Combien de temps pour faire un devis ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Environ 2 minutes depuis votre téléphone. Le partage WhatsApp et la facturation sont inclus à partir du plan Starter (19€/mois).",
        },
      },
      {
        "@type": "Question",
        name: "Comment fonctionnent les relances J+3 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "3 jours après l'envoi sans réponse, un email automatique est envoyé au client. L'artisan reçoit un lien WhatsApp pré-rempli pour relancer. Plans Starter et Pro.",
        },
      },
    ],
  };
}

export function jsonLdTarifs() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "DevisPropre — Abonnement artisan",
    description: "Devis et factures pour artisans",
    brand: { "@type": "Brand", name: SITE.name },
    offers: [
      { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Starter", price: "19", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Pro", price: "39", priceCurrency: "EUR" },
    ],
  };
}
