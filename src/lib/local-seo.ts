import { MARKETING_ROUTES } from "./routes";

export interface TradeMeta {
  slug: string;
  label: string;
  plural: string;
  description: string;
}

export interface CityMeta {
  slug: string;
  label: string;
  region: string;
}

export const TRADES: Record<string, TradeMeta> = {
  plombier: {
    slug: "plombier",
    label: "Plombier",
    plural: "Plombiers",
    description: "Devis et factures pour plombiers — conforme TVA, partage WhatsApp.",
  },
  electricien: {
    slug: "electricien",
    label: "Électricien",
    plural: "Électriciens",
    description: "Devis électricité en 2 minutes depuis le chantier.",
  },
  peintre: {
    slug: "peintre",
    label: "Peintre",
    plural: "Peintres",
    description: "Devis peinture BTP — PDF pro, envoi client en 1 clic.",
  },
  macon: {
    slug: "macon",
    label: "Maçon",
    plural: "Maçons",
    description: "Facturation maçonnerie simplifiée pour auto-entrepreneurs.",
  },
  couvreur: {
    slug: "couvreur",
    label: "Couvreur",
    plural: "Couvreurs",
    description: "Devis toiture et couverture — mobile-first.",
  },
  chauffagiste: {
    slug: "chauffagiste",
    label: "Chauffagiste",
    plural: "Chauffagistes",
    description: "Devis chauffage et climatisation conformes anti-fraude.",
  },
};

export const CITIES: Record<string, CityMeta> = {
  paris: { slug: "paris", label: "Paris", region: "Île-de-France" },
  lyon: { slug: "lyon", label: "Lyon", region: "Auvergne-Rhône-Alpes" },
  marseille: { slug: "marseille", label: "Marseille", region: "PACA" },
  toulouse: { slug: "toulouse", label: "Toulouse", region: "Occitanie" },
  nice: { slug: "nice", label: "Nice", region: "PACA" },
  nantes: { slug: "nantes", label: "Nantes", region: "Pays de la Loire" },
  bordeaux: { slug: "bordeaux", label: "Bordeaux", region: "Nouvelle-Aquitaine" },
  lille: { slug: "lille", label: "Lille", region: "Hauts-de-France" },
  strasbourg: { slug: "strasbourg", label: "Strasbourg", region: "Grand Est" },
  montpellier: { slug: "montpellier", label: "Montpellier", region: "Occitanie" },
};

const MARKETING_SET = new Set<string>(MARKETING_ROUTES);

export function getTrade(slug: string): TradeMeta | undefined {
  return TRADES[slug];
}

export function getCity(slug: string): CityMeta | undefined {
  return CITIES[slug];
}

export function localSeoPath(metier: string, ville?: string): string {
  return ville ? `/devis-artisan/${metier}/${ville}` : `/devis-artisan/${metier}`;
}

/** Toutes les URLs SEO local pour sitemap. */
export function getAllLocalSeoPaths(): string[] {
  const paths: string[] = [];
  for (const trade of Object.values(TRADES)) {
    paths.push(localSeoPath(trade.slug));
    for (const city of Object.values(CITIES)) {
      paths.push(localSeoPath(trade.slug, city.slug));
    }
  }
  return paths;
}

export function isMarketingCacheable(pathname: string): boolean {
  if (MARKETING_SET.has(pathname)) return true;
  return pathname.startsWith("/devis-artisan/");
}

export function localPageTitle(trade: TradeMeta, city?: CityMeta): string {
  if (city) {
    return `Devis ${trade.label} à ${city.label} — logiciel artisan`;
  }
  return `Devis ${trade.label} — logiciel facturation BTP`;
}

export function localPageDescription(trade: TradeMeta, city?: CityMeta): string {
  if (city) {
    return `${trade.plural} à ${city.label} (${city.region}) : créez un devis conforme en 2 minutes, partage WhatsApp, facturation Starter+. ${trade.description}`;
  }
  return `${trade.description} DevisPropre — simple comme un SMS, conforme loi anti-fraude TVA 2018.`;
}

export function localKeywords(trade: TradeMeta, city?: CityMeta): string[] {
  const base = [
    `devis ${trade.slug}`,
    `facture ${trade.slug}`,
    `logiciel devis ${trade.slug}`,
    "devis artisan",
    "facturation BTP",
  ];
  if (city) {
    base.unshift(
      `devis ${trade.slug} ${city.slug}`,
      `${trade.slug} ${city.label}`,
      `facture ${trade.slug} ${city.label}`
    );
  }
  return base;
}
