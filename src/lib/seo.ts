import type { Metadata } from "next";
import { env } from "./env";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://devispropre.fr"
);

const DEFAULT_SAME_AS = [
  "https://www.linkedin.com/company/devispropre",
  "https://twitter.com/devispropre",
] as const;

export const SITE = {
  name: "DevisPropre",
  url: APP_URL,
  locale: "fr_FR",
  phone: "06 60 61 48 39",
  phoneRaw: "33660614839",
  owner: "Benjamin Boyer",
  email: "contact@devispropre.fr",
  sameAs: DEFAULT_SAME_AS,
  description:
    "Logiciel de devis et factures pour artisans du BTP. PDF conforme, envoi WhatsApp, loi anti-fraude TVA 2018. Plombier, électricien, peintre — dès 19€/mois.",
  tagline: "L'anti-usine à gaz de l'artisanat",
} as const;

/** Liens sameAs JSON-LD — surcharge via SITE_SAME_AS (URLs séparées par des virgules). */
export function getSiteSameAs(): string[] {
  return env.siteSameAs.length > 0 ? env.siteSameAs : [...SITE.sameAs];
}

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
  "logiciel devis auto entrepreneur",
  "application devis batiment gratuite",
  "devis artisan sur téléphone",
  "alternative tolteck",
  "logiciel facturation micro entreprise btp",
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
  /** OG dynamique par route (ex. pages SEO local). */
  ogImagePath?: string;
}): Metadata {
  const url = `${SITE.url}${opts.path}`;
  const ogTitle = `${opts.title} | ${SITE.name}`;
  const ogImageUrl = opts.ogImagePath ?? OG_IMAGE.url;
  const ogImage = { ...OG_IMAGE, url: ogImageUrl };
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords ?? [...KEYWORDS],
    alternates: {
      canonical: url,
      languages: {
        "fr-FR": url,
        fr: url,
        "x-default": url,
      },
    },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: ogTitle,
      description: opts.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: opts.description,
      images: [ogImage],
    },
  };
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Devis artisans en 2 min | DevisPropre",
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
    title: "Devis artisans en 2 min | DevisPropre",
    description: SITE.description,
    ...sharedSocial,
  },
  twitter: {
    card: "summary_large_image",
    title: "Devis & factures artisans | DevisPropre",
    description: SITE.description,
    ...sharedSocial,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: SITE.url,
    languages: {
      "fr-FR": SITE.url,
      fr: SITE.url,
      "x-default": SITE.url,
    },
  },
};

/** JSON-LD site global — un seul bloc @graph (évite la duplication layout + pages). */
export function jsonLdSiteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [jsonLdWebSite(), jsonLdOrganization()],
  };
}

export function jsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/devis-artisan/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function jsonLdSoftwareApplication() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "FinanceApplication",
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
    sameAs: getSiteSameAs(),
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

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function jsonLdBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

export function jsonLdHowToCreateDevis() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Créer un devis artisan en 2 minutes avec DevisPropre",
    description: "Guide rapide pour rédiger et envoyer un devis PDF conforme depuis votre téléphone.",
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Saisir le client et les prestations",
        text: "Renseignez le client, la description, la quantité et le prix TTC. Le calcul se fait automatiquement.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Générer le PDF professionnel",
        text: "DevisPropre produit un PDF avec logo, SIRET et mentions légales conformes au BTP.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Partager au client",
        text: "Envoyez le devis par WhatsApp ou email. Le client peut valider en ligne via un lien sécurisé.",
      },
    ],
  };
}

export function jsonLdLocalBusiness(tradeLabel: string, cityLabel: string, region: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `DevisPropre pour ${tradeLabel} à ${cityLabel}`,
    description: `Logiciel de devis et factures pour ${tradeLabel.toLowerCase()} à ${cityLabel} (${region}).`,
    url: SITE.url,
    areaServed: {
      "@type": "City",
      name: cityLabel,
      containedInPlace: { "@type": "AdministrativeArea", name: region },
    },
    parentOrganization: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
