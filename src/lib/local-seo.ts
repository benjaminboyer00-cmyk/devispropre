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

/** Dernière mise à jour du contenu SEO local — évite un lastmod=new Date() à chaque build. */
export const LOCAL_SEO_LAST_MODIFIED = new Date("2026-05-28T00:00:00.000Z");

/** Pages marketing statiques — date de révision éditoriale. */
export const MARKETING_SITEMAP_LAST_MODIFIED = new Date("2026-05-28T00:00:00.000Z");

export function sitemapLastModifiedForPath(path: string): Date {
  if (path.startsWith("/devis-artisan/")) {
    return LOCAL_SEO_LAST_MODIFIED;
  }
  return MARKETING_SITEMAP_LAST_MODIFIED;
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

export function isLocalSeoPath(pathname: string): boolean {
  return pathname.startsWith("/devis-artisan/");
}

function pairHash(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const CITY_FACTS: Record<string, string> = {
  paris:
    "À Paris, les devis pour copropriétés exigent souvent un détail ligne par ligne pour le syndic et les AG.",
  lyon:
    "À Lyon, les artisans en Presqu'île et Confluence enchaînent plusieurs petits chantiers : un devis clair évite les allers-retours.",
  marseille:
    "À Marseille, les interventions en rues étroites du Panier ou du Vieux-Port demandent des créneaux précis — le client valide plus vite avec un PDF lisible.",
  toulouse:
    "À Toulouse, le marché de la rénovation dans l'hypercentre pousse les clients à comparer plusieurs devis le week-end.",
  nice:
    "Sur la Côte d'Azur, la saisonnalité est forte : un devis envoyé en 2 minutes peut faire la différence avant un concurrent.",
  nantes:
    "À Nantes, les projets de rénovation dans l'Île de Nantes multiplient les demandes de devis détaillés avec TVA claire.",
  bordeaux:
    "À Bordeaux, les maisons en pierre du centre historique impliquent souvent des surprises en cours de chantier — mieux vaut un devis structuré dès le départ.",
  lille:
    "Dans la métropole lilloise, les clients particuliers attendent un devis rapide par WhatsApp après la visite sur place.",
  strasbourg:
    "À Strasbourg, la proximité Allemagne amène parfois des clients bilingues : un PDF pro rassure autant que le prix.",
  montpellier:
    "À Montpellier, la croissance démographique génère beaucoup de demandes en plomberie et électricité — répondre vite avec un devis conforme fidélise.",
};

const TRADE_ANGLES: Record<string, string> = {
  plombier:
    "Pour un plombier, une fuite un dimanche peut se transformer en trois devis comparés le lundi matin.",
  electricien:
    "Pour un électricien, la mise aux normes est souvent chiffrée en plusieurs postes — DevisPropre les structure proprement.",
  peintre:
    "Pour un peintre, surface, préparation et finition se lisent mieux sur un PDF que sur un SMS.",
  macon:
    "Pour un maçon, le client veut voir clairement main-d'œuvre et fournitures avant d'engager des travaux lourds.",
  couvreur:
    "Pour un couvreur, la météo impose des délais serrés : envoyer le devis avant la pluie suivante, c'est conclure.",
  chauffagiste:
    "Pour un chauffagiste, la période de chauffe concentre les demandes — un devis conforme anti-fraude rassure sur la facturation à venir.",
};

const LOCAL_TESTIMONIALS: Record<string, { author: string; quote: string }[]> = {
  paris: [
    { author: "Karim L., plombier", quote: "Mes clients parisiens veulent un PDF, pas un SMS. DevisPropre me fait gagner un créneau par jour." },
    { author: "Sophie M., peintre", quote: "En copropriété, le syndic apprécie les devis propres avec SIRET. Ça accélère les validations." },
  ],
  marseille: [
    { author: "Antoine R., électricien", quote: "Entre deux chantiers dans le 7e, je fais le devis dans la camionnette. Le client reçoit le lien avant que je reparte." },
    { author: "Julie P., couvreur", quote: "Les clients marseillais comparent vite — un devis clair le jour même, ça se transforme en signature." },
  ],
  lyon: [
    { author: "Thomas B., chauffagiste", quote: "Pendant la saison de chauffe, je n'ai pas le temps d'Excel. Là, c'est client + prix + envoi." },
    { author: "Marc D., maçon", quote: "Les rénovations à Lyon Part-Dieu demandent des devis détaillés. DevisPropre structure mes postes sans prise de tête." },
  ],
  default: [
    { author: "Lucas F., artisan BTP", quote: "Simple comme un SMS, mais conforme pour la facture ensuite. Exactement ce qu'il me fallait." },
    { author: "Émilie C., électricienne", quote: "Mes clients reçoivent un PDF pro en moins de 2 minutes. Je parais plus sérieuse qu'avec un bout de papier." },
  ],
};

/** Paragraphe unique par couple métier/ville (évite le spintax). */
export function getLocalUniqueInsight(trade: TradeMeta, city: CityMeta): string {
  const fact = CITY_FACTS[city.slug] ?? `À ${city.label}, vos clients attendent un devis rapide et lisible sur mobile.`;
  const angle =
    TRADE_ANGLES[trade.slug] ??
    `Les ${trade.plural.toLowerCase()} locaux gagnent du temps avec un PDF professionnel et conforme.`;
  return `${fact} ${angle}`;
}

export function getLocalTestimonial(trade: TradeMeta, city: CityMeta): { author: string; quote: string } {
  const pool = LOCAL_TESTIMONIALS[city.slug] ?? LOCAL_TESTIMONIALS.default;
  return pool[pairHash(trade.slug, city.slug) % pool.length];
}

export interface LocalSeeAlsoLink {
  href: string;
  label: string;
}

export function getLocalSeeAlsoLinks(trade: TradeMeta, city?: CityMeta): LocalSeeAlsoLink[] {
  if (!city) {
    return Object.values(CITIES)
      .slice(0, 4)
      .map((c) => ({
        href: localSeoPath(trade.slug, c.slug),
        label: `${trade.label} à ${c.label}`,
      }));
  }

  const links: LocalSeeAlsoLink[] = [
    { href: localSeoPath(trade.slug), label: `Tous les devis ${trade.label.toLowerCase()} en France` },
  ];

  const otherCities = Object.values(CITIES)
    .filter((c) => c.slug !== city.slug)
    .sort((a, b) => pairHash(trade.slug, a.slug) - pairHash(trade.slug, b.slug))
    .slice(0, 3);

  for (const c of otherCities) {
    links.push({
      href: localSeoPath(trade.slug, c.slug),
      label: `${trade.label} à ${c.label}`,
    });
  }

  return links;
}

export function getLocalBreadcrumbs(trade: TradeMeta, city?: CityMeta) {
  const items = [
    { name: "Accueil", path: "/" },
    { name: "Devis artisan", path: "/devis-artisan/plombier" },
    { name: trade.plural, path: localSeoPath(trade.slug) },
  ];
  if (city) {
    items.push({ name: city.label, path: localSeoPath(trade.slug, city.slug) });
  }
  return items;
}

export function localPageTitle(trade: TradeMeta, city?: CityMeta): string {
  if (city) {
    return `Devis ${trade.label} ${city.label}`;
  }
  return `Devis ${trade.label} — logiciel BTP`;
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
