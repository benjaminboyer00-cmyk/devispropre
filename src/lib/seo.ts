import type { Metadata } from "next";
import { env } from "./env";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://devispropre.com"
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
  email: "contact@devispropre.com",
  sameAs: DEFAULT_SAME_AS,
  description:
    "Créez un devis pro en 2 min depuis votre téléphone. Conformité TVA 2018 garantie. Essai 15 jours gratuit, puis 19€/mois. WhatsApp, factures, relances J+3.",
  tagline: "L'anti-usine à gaz de l'artisanat",
} as const;

/** Nom de domaine public (sans www) — OG, footer, mentions légales. */
export function siteHostname(): string {
  try {
    return new URL(SITE.url).hostname.replace(/^www\./, "");
  } catch {
    return "devispropre.com";
  }
}

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
  /** Pages funnel / transitoires — noindex. */
  noindex?: boolean;
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
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
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
  ...(env.googleSiteVerification
    ? { verification: { google: env.googleSiteVerification } }
    : {}),
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
  };
}

export const HOME_FAQ = [
  {
    q: "DevisPropre est-il conforme à la loi anti-fraude TVA 2018 ?",
    a: "Oui. Verrouillage des factures, empreinte SHA-256, chaînage et attestation individuelle.",
  },
  {
    q: "Combien de temps pour faire un devis ?",
    a: "Environ 2 minutes depuis votre téléphone. Le partage WhatsApp et la facturation sont inclus à partir du plan Starter (19€/mois).",
  },
  {
    q: "Comment fonctionnent les relances J+3 ?",
    a: "3 jours après l'envoi sans réponse, un email automatique est envoyé au client. L'artisan reçoit un lien WhatsApp pré-rempli pour relancer. Plans Starter et Pro.",
  },
] as const;

export function jsonLdFaqFromItems(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function jsonLdFaq() {
  return jsonLdFaqFromItems(HOME_FAQ);
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

/** Product + offre tarifaire — sans avis fictifs (conformité rich snippets Google). */
export function jsonLdProductOffer() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SITE.name,
    description: SITE.description,
    brand: { "@type": "Brand", name: SITE.name },
    url: SITE.url,
    offers: {
      "@type": "Offer",
      price: "19",
      priceCurrency: "EUR",
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      availability: "https://schema.org/InStock",
      url: `${SITE.url}/tarifs`,
    },
  };
}

/** @deprecated Utiliser jsonLdProductOffer — conservé pour compatibilité interne. */
export function jsonLdProductReviews() {
  return jsonLdProductOffer();
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
    description:
      "Guide rapide pour rédiger un devis PDF conforme, l'envoyer au client puis le convertir en facture.",
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
        text: "Envoyez le devis par WhatsApp, SMS ou email. Le client valide en ligne via un lien sécurisé.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Convertir en facture conforme",
        text: "Devis accepté → facture en 1 clic, verrouillage légal et attestation TVA 2018.",
      },
    ],
  };
}

export const CREER_DEVIS_FAQ = [
  {
    q: "Puis-je créer un devis sans compte ?",
    a: "Oui. Rédigez votre devis sur cette page — le brouillon est sauvegardé sur votre appareil. Créez ensuite un compte pour obtenir le PDF, le lien client et la facture.",
  },
  {
    q: "Comment passer du devis à la facture ?",
    a: "Envoyez le devis au client. Une fois accepté, cliquez sur « Créer et émettre la facture » : les lignes sont reprises sans ressaisie, conformément à la loi anti-fraude TVA 2018.",
  },
  {
    q: "Le devis est-il conforme pour les artisans du BTP ?",
    a: "Oui : mentions légales, SIRET, TVA (0 %, 5,5 %, 10 %, 20 % ou franchise art. 293 B), validité et PDF professionnel.",
  },
  {
    q: "Comment partager le devis au client ?",
    a: "Après envoi, vous obtenez un lien unique plus un message pré-rempli pour WhatsApp, SMS ou email.",
  },
] as const;

export function jsonLdCreerDevisFaq() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CREER_DEVIS_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function jsonLdCreerDevisWebPage() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Créer un devis et une facture artisan gratuitement",
    description:
      "Rédigez un devis BTP sans compte, sauvegarde automatique, puis facture conforme TVA 2018 après acceptation client.",
    url: `${SITE.url}/creer-devis`,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    about: [
      { "@type": "Thing", name: "Devis artisan BTP" },
      { "@type": "Thing", name: "Facture conforme TVA 2018" },
    ],
  };
}

/** Article éditorial / landing SEO local — rich result BlogPosting. */
export function jsonLdBlogPosting(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.headline,
    description: opts.description,
    url: `${SITE.url}${opts.path}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { "@type": "Person", name: SITE.owner },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}${OG_IMAGE.url}` },
    },
    inLanguage: "fr-FR",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}${opts.path}` },
  };
}

export function jsonLdConformiteWebPage() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Conformité loi anti-fraude TVA 2018 — DevisPropre",
    description:
      "Inaltérabilité, sécurisation SHA-256, chaînage cryptographique et attestation PDF conforme à la loi anti-fraude TVA 2018.",
    url: `${SITE.url}/conformite`,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    about: { "@type": "Thing", name: "Loi anti-fraude TVA 2018" },
  };
}

/** Landing SEO local — WebPage (pas LocalBusiness ni BlogPosting). */
export function jsonLdLocalSeoWebPage(opts: {
  name: string;
  description: string;
  path: string;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: `${SITE.url}${opts.path}`,
    dateModified: opts.dateModified,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    about: {
      "@type": "SoftwareApplication",
      name: SITE.name,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
    },
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
