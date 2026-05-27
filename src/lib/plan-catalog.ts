/** Source unique des fonctionnalités par plan — alignée sur le code. */
export const PLAN_CATALOG = {
  FREE: {
    id: "FREE" as const,
    name: "Gratuit",
    price: "0€",
    period: "",
    desc: "Après essai ou résiliation — 3 devis / mois",
    highlight: false,
    features: [
      "3 devis PDF par mois",
      "Mentions légales automatiques (SIRET, adresse)",
      "Verrouillage & empreinte SHA-256 à l'envoi",
      "Vérification d'intégrité des documents",
    ],
    excluded: [
      "Partage WhatsApp",
      "Facturation conforme TVA 2018",
      "Relances automatiques J+3",
    ],
  },
  STARTER: {
    id: "STARTER" as const,
    name: "Starter",
    price: "19€",
    period: "/mois",
    desc: "15 jours gratuits puis 19€/mois — carte requise",
    highlight: true,
    features: [
      "Devis illimités + PDF professionnel",
      "Partage WhatsApp (message pré-rempli, 1 clic)",
      "Relance J+3 : email auto au client + lien WhatsApp pour vous",
      "Factures conformes loi anti-fraude TVA 2018",
      "Attestation individuelle PDF téléchargeable",
      "Chaînage SHA-256 & journal d'audit par document",
    ],
    excluded: [] as string[],
  },
  PRO: {
    id: "PRO" as const,
    name: "Pro",
    price: "39€",
    period: "/mois",
    desc: "Équipe jusqu'à 5 utilisateurs",
    highlight: false,
    features: [
      "Tout le plan Starter",
      "Statistiques avancées + export CSV",
      "Journal d'audit complet (toutes actions)",
      "Multi-utilisateurs : invitations par email",
      "Support prioritaire (réponse sous 24h ouvrées)",
    ],
    excluded: [] as string[],
  },
} as const;

export const TARIFS_FAQ = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "À l'inscription, vous enregistrez votre carte bancaire via Stripe. Vous profitez de 15 jours gratuits sur le plan Starter (devis illimités, WhatsApp, factures). Si vous ne résiliez pas avant la fin, l'abonnement à 19€/mois démarre automatiquement.",
  },
  {
    q: "Comment fonctionnent les relances J+3 ?",
    a: "3 jours après l'envoi d'un devis sans réponse, DevisPropre envoie automatiquement un email de rappel au client (si son email est renseigné). Vous recevez aussi un email avec un lien WhatsApp pré-rempli pour relancer manuellement. Réservé au plan Starter et Pro.",
  },
  {
    q: "WhatsApp est-il automatique ?",
    a: "Non — le partage WhatsApp se fait en 1 clic depuis l'app (lien wa.me + message pré-rempli). Les relances email au client, elles, sont automatiques. Plan Starter minimum.",
  },
  {
    q: "Qu'est-ce que l'attestation individuelle ?",
    a: "À chaque émission de facture, une attestation de conformité est générée avec empreinte SHA-256. Vous la téléchargez en PDF depuis la fiche facture (plan Starter+).",
  },
  {
    q: "Le plan Gratuit permet-il de facturer ?",
    a: "Non. La facturation conforme TVA 2018, l'attestation PDF et les relances nécessitent le plan Starter (19€/mois).",
  },
  {
    q: "Multi-utilisateurs Pro : comment ça marche ?",
    a: "Invitez jusqu'à 5 collaborateurs par email depuis Paramètres. Ils créent un compte (ou se connectent) avec la même adresse et accèdent à vos devis et factures.",
  },
] as const;

export const COMPARISON_ROWS = [
  { label: "Devis / mois", free: "3", starter: "Illimité", pro: "Illimité" },
  { label: "PDF + mentions légales", free: true, starter: true, pro: true },
  { label: "Partage WhatsApp", free: false, starter: true, pro: true },
  { label: "Relance email client J+3", free: false, starter: true, pro: true },
  { label: "Factures TVA 2018", free: false, starter: true, pro: true },
  { label: "Attestation PDF", free: false, starter: true, pro: true },
  { label: "Statistiques + export CSV", free: false, starter: false, pro: true },
  { label: "Journal d'audit complet", free: false, starter: false, pro: true },
  { label: "Multi-utilisateurs", free: false, starter: false, pro: "5 max" },
  { label: "Support prioritaire", free: false, starter: false, pro: true },
] as const;
