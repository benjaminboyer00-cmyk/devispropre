import { ROUTES } from "./routes";

export interface GuideArticle {
  href: string;
  title: string;
  description: string;
  keywords: string[];
  datePublished?: string;
  dateModified?: string;
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    href: ROUTES.guideDevisConforme,
    title: "Comment faire un devis artisan conforme",
    description: "Mentions obligatoires, durée de validité, acceptation client et passage en facture.",
    keywords: ["devis artisan conforme", "modèle devis BTP"],
  },
  {
    href: ROUTES.guideFacturationAe,
    title: "Facturation auto-entrepreneur et artisan",
    description: "Devis → facture, franchise TVA ou assujetti, obligations anti-fraude 2018.",
    keywords: ["facture auto entrepreneur", "facturation artisan"],
  },
  {
    href: ROUTES.guideTvaArtisan,
    title: "TVA artisan travaux",
    description: "Taux 5,5 %, 10 %, 20 % et franchise en base — art. 293 B CGI.",
    keywords: ["TVA artisan", "TVA travaux rénovation"],
  },
  {
    href: ROUTES.guideMentionsDevis,
    title: "Mentions obligatoires sur un devis",
    description: "SIRET, adresse, validité, signature client — checklist complète.",
    keywords: ["mentions obligatoires devis", "devis SIRET"],
  },
  {
    href: ROUTES.guideDevisWhatsapp,
    title: "Envoyer un devis par WhatsApp",
    description: "PDF pro, lien client, message pré-rempli et relance J+3.",
    keywords: ["devis WhatsApp", "devis plombier PDF"],
  },
];

/** Articles éditoriaux SEO (requêtes informationnelles). */
export const BLOG_EDITORIAL_ARTICLES: GuideArticle[] = [
  {
    href: ROUTES.blogDevisPlombier,
    title: "Comment chiffrer un chantier de plomberie en 2026",
    description:
      "Méthode terrain : diagnostic, fournitures, main-d'œuvre, déplacement et marge — avec exemple chiffré pour Paris et province.",
    keywords: ["devis plombier", "chiffrage plomberie", "prix plombier chantier"],
    datePublished: "2026-05-20T00:00:00.000Z",
    dateModified: "2026-05-28T00:00:00.000Z",
  },
  {
    href: ROUTES.blogFactureAe2026,
    title: "Facture auto-entrepreneur 2026 : obligations et modèle",
    description:
      "Différence devis/facture, mentions obligatoires, franchise TVA vs assujetti, numérotation et conformité anti-fraude.",
    keywords: ["facture auto entrepreneur 2026", "devis facture auto-entrepreneur", "mentions obligatoires facture"],
    datePublished: "2026-05-22T00:00:00.000Z",
    dateModified: "2026-05-28T00:00:00.000Z",
  },
  {
    href: ROUTES.blogDevisElectricien,
    title: "Devis électricien : chiffrer une mise aux normes NF C 15-100",
    description:
      "Postes obligatoires, tableau, différentiel 30 mA, GTL, TVA 10 % rénovation et exemple chiffré pour un T2 en copropriété.",
    keywords: ["devis électricien", "mise aux normes électricité", "NF C 15-100 devis", "prix électricien rénovation"],
    datePublished: "2026-05-25T00:00:00.000Z",
    dateModified: "2026-05-28T00:00:00.000Z",
  },
  {
    href: ROUTES.blogRelancerDevis,
    title: "Relancer un devis artisan sans être lourd (WhatsApp, email, J+3)",
    description:
      "Timing, formulation, relance automatique J+3 et suivi des devis en attente — méthode terrain pour artisans BTP.",
    keywords: ["relancer devis artisan", "devis sans réponse", "relance devis WhatsApp", "suivi devis BTP"],
    datePublished: "2026-05-27T00:00:00.000Z",
    dateModified: "2026-05-28T00:00:00.000Z",
  },
];

export const ALL_BLOG_ARTICLES: GuideArticle[] = [...BLOG_EDITORIAL_ARTICLES, ...GUIDE_ARTICLES];
