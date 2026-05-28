import type { CityMeta, TradeMeta } from "./local-seo";

function pairHash(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

/** Contexte métier détaillé — varie par métier. */
const TRADE_DEEP: Record<string, string[]> = {
  plombier: [
    "Les plombiers jonglent entre dépannages urgents et chantiers planifiés. Un devis doit séparer main-d'œuvre, fournitures (robinetterie, PER, cuivre) et éventuels forfaits déplacement. DevisPropre calcule le TTC ligne par ligne et fige le PDF à l'envoi — indispensable quand le client compare trois artisans le même jour.",
    "En plomberie, les avenants sont fréquents après ouverture de cloison. Partir d'un devis structuré avec numérotation claire limite les litiges. Chaque ligne reste traçable jusqu'à la facture conforme TVA 2018, avec empreinte SHA-256 à l'émission.",
    "Les particuliers et syndics exigent un SIRET visible, une TVA explicite ou la mention franchise en base, et un PDF lisible sur mobile. DevisPropre injecte automatiquement vos mentions légales depuis votre fiche entreprise.",
  ],
  electricien: [
    "L'électricien structure souvent ses devis en postes : tableau, prises, éclairage, mise aux normes NF C 15-100. DevisPropre permet plusieurs lignes avec quantités et prix unitaire HT, puis applique votre taux de TVA ou la franchise selon votre statut.",
    "Les diagnostics et devis de mise en conformité impliquent des descriptions longues. Le PDF généré reste professionnel, avec votre logo et vos coordonnées — un signal de sérieux face aux auto-entrepreneurs qui envoient encore des photos de carnet.",
    "Après acceptation du devis en ligne, la conversion en facture reprend exactement les montants verrouillés. Vous respectez la chaîne de facturation exigée par l'administration fiscale sans ressaisie Excel.",
  ],
  peintre: [
    "Un devis peinture distingue préparation (ponçage, enduit), fourniture (peinture, sous-couche) et application. DevisPropre affiche chaque poste en HT puis le TTC global — le client comprend pourquoi 45 m² de murs ne coûtent pas le même prix qu'un plafond.",
    "Les chantiers en appartement occupé demandent des créneaux précis et un devis envoyé avant le week-end. Depuis le téléphone, vous créez le PDF et le partagez par WhatsApp (plan Starter) avec un message pré-rempli.",
    "Les devis peinture refusés restent archivés avec leur hash. Vous gardez une trace en cas de contentieux sur les surfaces initiales ou les teintes choisies.",
  ],
  macon: [
    "Le maçon chiffre souvent gros œuvre et second œuvre sur le même document. DevisPropre supporte des lignes détaillées (démolition, fondations, reprise d'étanchéité) sans limite artificielle sur le Starter.",
    "Les clients particuliers en rénovation lourde comparent plusieurs devis sur le même cahier des charges. Un PDF homogène avec votre raison sociale et votre RCS rassure avant le premier acompte.",
    "Une fois le devis accepté, la facture reprend les mêmes bases HT/TVA. Le verrouillage empêche toute modification des montants après émission — exigence centrale de la loi anti-fraude.",
  ],
  couvreur: [
    "Couverture et zinguerie impliquent des devis sensibles à la météo. Envoyer le document le jour de la visite, avant la pluie annoncée, augmente le taux de signature. DevisPropre permet cette réactivité depuis le véhicule.",
    "Les lignes typiques couvrent dépose, fourniture tuiles ou ardoises, échafaudage et main-d'œuvre. Le total TTC est recalculé automatiquement si vous ajustez une quantité sur place.",
    "Les factures émises depuis DevisPropre sont chaînées cryptographiquement. En cas de contrôle, vous produisez l'attestation PDF individuelle avec empreinte du document.",
  ],
  chauffagiste: [
    "Chaudière, pompe à chaleur, entretien annuel : le chauffagiste mélange vente matériel et forfaits MO. DevisPropre sépare clairement équipement, pose et garantie constructeur dans le PDF client.",
    "La saison de chauffe concentre les demandes — répondre en 2 minutes avec un devis conforme évite de perdre le créneau au profit d'un concurrent plus réactif.",
    "La relance J+3 (Starter+) envoie un email au client si le devis reste sans réponse, avec lien WhatsApp pour vous. Moins de devis oubliés en période de rush.",
  ],
};

/** Contexte local détaillé — varie par ville. */
const CITY_DEEP: Record<string, string[]> = {
  paris: [
    "Paris combine copropriétés anciennes, logements sociaux et bureaux reconvertis. Les syndics demandent des devis détaillés pour vote en AG ; les particuliers veulent une réponse le jour même de la visite. Un PDF avec SIRET et TVA claire accélère les validations dans les arrondissements denses.",
    "La concurrence y est forte : un artisan réactif avec un document professionnel se démarque des devis manuscrits ou Word mal formatés. DevisPropre standardise votre image sans logiciel lourd.",
    "Les artisans parisiens enchaînent souvent plusieurs petits chantiers par semaine. Gagner 15 minutes par devis représente une demi-journée récupérée chaque mois.",
  ],
  lyon: [
    "Lyon mêle Presqu'île commerçante, Confluence en rénovation et communes périurbaines. Les clients comparent vite entre deux visites le samedi. Un devis PDF envoyé avant le retour domicile du client fait pencher la balance.",
    "La métropole lyonnaise voit beaucoup de rénovations énergétiques. Structurer les postes isolation + équipement rassure les ménages éligibles aux aides.",
    "Les artisans lyonnais partagent souvent leurs devis par WhatsApp après une visite. Le plan Starter active le lien wa.me avec message pré-rempli.",
  ],
  marseille: [
    "Marseille impose des contraintes d'accès (rues étroites, vieux immeubles, mistral en toiture). Un devis précis sur les conditions d'intervention évite les malentendus avec le client.",
    "Le rythme marseillais favorise les artisans qui répondent vite. Créer le devis dans la camionnette entre deux rendez-vous dans le 7e ou 8e arrondissement devient routine.",
    "La clientèle locale apprécie le français clair et les montants TTC visibles. DevisPropre affiche les totaux sans calcul mental pour le client.",
  ],
  toulouse: [
    "Toulouse connaît une forte demande en rénovation dans l'hypercentre et les quartiers en expansion. Les devis comparatifs arrivent souvent le dimanche soir — être le premier PDF pro dans la boîte mail compte.",
    "Aerospace et population étudiante créent une clientèle exigeante sur le digital. Un lien de devis consultable en ligne renforce votre crédibilité.",
    "Les artisans toulousains interviennent aussi en Haute-Garonne périphérique. Le même outil fonctionne sur chantier et au bureau.",
  ],
  nice: [
    "Nice et la Côte d'Azur connaissent une saisonnalité marquée : résidences secondaires, hôtels, copropriétés en bord de mer. Anticiper la haute saison avec des devis rapides sécurise le planning.",
    "Les clients niçois comparent prix et présentation. Un PDF avec logo et mentions légales complet inspire plus confiance qu'un SMS avec un montant seul.",
    "L'humidité et le sel marin génèrent des demandes récurrentes en plomberie et couverture — des devis clairs sur les garanties matériaux limitent les négociations.",
  ],
  nantes: [
    "Nantes combine rénovation dans l'Île de Nantes, maisons en Loire-Atlantique et neuf périurbain. Les ménages demandent des devis détaillés pour financement ou prêt travaux.",
    "La métropole nantaise valorise les artisans locaux réactifs. Répondre en moins de 2 heures avec un document conforme améliore le taux d'acceptation.",
    "Les artisans nantais utilisent de plus en plus WhatsApp avec leurs clients pro. DevisPropre intègre le partage en un clic.",
  ],
  bordeaux: [
    "Bordeaux mélange pierre de taille en centre, rénovation thermique et extension en Gironde. Les surprises en cours de chantier sont fréquentes — un devis initial bien structuré sert de base à tout avenant.",
    "Le vin et le tourisme attirent une clientèle exigeante sur l'esthétique des documents. Votre logo sur le PDF renforce votre marque artisan.",
    "Les artisans bordelais desservent aussi le Bassin d'Arcachon. Même processus de devis depuis le mobile, où que soit le chantier.",
  ],
  lille: [
    "Lille et la métropole lilloise voient une forte demande en rénovation d'habitat ancien. Les clients attendent un devis WhatsApp après la visite — habitués au digital.",
    "La proximité Belgique amène parfois des questions sur TVA et facturation. DevisPropre gère franchise ou TVA applicable selon votre fiche entreprise.",
    "Les hivers rigoureux boostent plomberie et chauffage — des devis émis vite en période de fuite ou panne chaudière captent la demande urgente.",
  ],
  strasbourg: [
    "Strasbourg accueille une clientèle parfois bilingue et des bâtiments alsaciens spécifiques. Un PDF soigné compense une barrière linguistique éventuelle.",
    "Le centre historique impose des contraintes d'accès similaires à d'autres grandes villes. Préciser déplacement et horaires dans les notes du devis clarifie l'intervention.",
    "Les artisans strasbourgeois interviennent en Alsace et vers l'Allemagne. La conformité TVA française reste obligatoire — DevisPropre l'intègre nativement.",
  ],
  montpellier: [
    "Montpellier croît vite : neuf, rénovation et piscines en périphérie. La concurrence entre artisans est dynamique — la réactivité du devis fait la différence.",
    "La population étudiante et les retraités installés génèrent des demandes variées. Un outil simple sans formation longue convient aux micro-entreprises.",
    "Le climat méditerranéen accélère les dégradations toiture et façade — les couvreurs et peintres enchaînent ; un devis en 2 minutes libère du temps chantier.",
  ],
};

/** Cas d'usage croisés métier × ville — combinaisons uniques. */
const PAIR_SCENARIOS: Record<string, string> = {
  "plombier:paris":
    "Exemple concret à Paris : remplacement de groupe de sécurité en copropriété haussmannienne. Le syndic exige un devis PDF avec détail fourniture + MO, TVA 10 % ou 20 % selon le cas. Vous chiffrez sur place, envoyez le lien avant de quitter la cour, le conseil syndical valide sous 48 h.",
  "electricien:lyon":
    "À Lyon Confluence, un restaurant demande une mise aux normes du tableau. Vous listez diagnostic, fourniture disjoncteurs, main-d'œuvre par demi-journée. Le gérant partage le PDF à son expert-comptable — la présentation DevisPropre évite les questions sur votre sérieux.",
  "peintre:marseille":
    "Peinture d'un T3 vue mer à Marseille : préparation murs salins, sous-couche, deux passes finition. Le client compare deux devis le lundi ; le vôtre, reçu le dimanche soir depuis DevisPropre, est le seul PDF complet avec SIRET.",
  "macon:toulouse":
    "Reprise de mur porteur en rénovation toulousaine : vous détaillez étaiement, démolition, reconstruction. Le montant TTC est verrouillé à l'envoi ; si le client accepte en ligne, la facture reprend les mêmes lignes sans ressaisie.",
  "couvreur:nice":
    "Réfection partielle toiture à Nice avant l'automne : tuiles, zinguerie, évacuation gravats. La météo impose un devis signé rapidement — WhatsApp Starter envoie le lien au client entre deux gouttes.",
  "chauffagiste:lille":
    "Remplacement chaudière gaz à Lille en période de chauffe : matériel, pose, raccordement, mise en service. DevisPropre calcule le TTC ; la relance J+3 rappelle le client si pas de réponse alors que vos concurrents attendent.",
};

function pairKey(trade: TradeMeta, city: CityMeta): string {
  return `${trade.slug}:${city.slug}`;
}

function scenarioForPair(trade: TradeMeta, city: CityMeta, seed: number): string {
  const key = pairKey(trade, city);
  if (PAIR_SCENARIOS[key]) return PAIR_SCENARIOS[key];

  const jobs: Record<string, string[]> = {
    plombier: ["dépannage fuite", "salle de bain clé en main", "détartrage circuit", "installation adoucisseur"],
    electricien: ["mise aux normes tableau", "rénovation électrique complète", "pose VMC", "domotique basique"],
    peintre: ["rafraîchissement appartement", "peinture façade", "remise en état après dégât des eaux", "decoration intérieure"],
    macon: ["extension maison", "reprise fissures", "dalle béton", "mur de clôture"],
    couvreur: ["remplacement tuiles", "zinguerie gouttières", "étanchéité toit plat", "démoussage"],
    chauffagiste: ["pompe à chaleur", "entretien annuel chaudière", "plancher chauffant", "radiateurs neufs"],
  };

  const job = pick(jobs[trade.slug] ?? ["intervention standard"], seed, 1);
  return `Cas fréquent pour un ${trade.label.toLowerCase()} à ${city.label} : ${job}. Vous estimez les postes sur place, le client reçoit un PDF avec votre SIRET et le détail HT/TVA. En ${city.region}, ce type de chantier se décide souvent dans la semaine — être le premier devis structuré augmente vos chances de signature.`;
}

export interface LocalPageSections {
  whyTitle: string;
  whyParagraphs: string[];
  featuresTitle: string;
  featuresParagraphs: string[];
  workflowTitle: string;
  workflowSteps: string[];
  marketTitle: string;
  marketParagraphs: string[];
  pricingTitle: string;
  pricingParagraph: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
}

export function getLocalPageSections(trade: TradeMeta, city: CityMeta): LocalPageSections {
  const seed = pairHash(trade.slug, city.slug);
  const tradeParas = TRADE_DEEP[trade.slug] ?? TRADE_DEEP.plombier;
  const cityParas = CITY_DEEP[city.slug] ?? CITY_DEEP.paris;

  return {
    whyTitle: `Pourquoi utiliser DevisPropre à ${city.label} ?`,
    whyParagraphs: [
      pick(cityParas, seed, 0),
      pick(tradeParas, seed, 1),
      scenarioForPair(trade, city, seed),
    ],
    featuresTitle: `Fonctionnalités clés pour les ${trade.plural.toLowerCase()}`,
    featuresParagraphs: [
      pick(tradeParas, seed, 2),
      `À ${city.label}, vos clients consultent le devis sur smartphone. Le PDF DevisPropre est lisible sur mobile, avec totaux HT/TVA/TTC explicites. Le verrouillage à l'envoi et l'empreinte SHA-256 protègent votre document — plus de contestation sur les montants initiaux.`,
    ],
    workflowTitle: `Comment créer un devis ${trade.label.toLowerCase()} à ${city.label} ?`,
    workflowSteps: [
      `Créez votre compte et renseignez votre SIRET, adresse en ${city.region} et logo.`,
      `Ajoutez le client (nom, téléphone pour WhatsApp, email pour relance J+3).`,
      `Saisissez vos lignes de prestation — DevisPropre calcule le TTC automatiquement.`,
      `Générez le PDF et partagez-le : le client accepte en ligne ou vous convertissez en facture conforme TVA 2018.`,
    ],
    marketTitle: `Marché ${trade.label.toLowerCase()} à ${city.label}`,
    marketParagraphs: [
      pick(cityParas, seed, 2),
      `Les ${trade.plural.toLowerCase()} de ${city.label} qui professionnalisent leurs devis réduisent les impayés et les négociations de dernière minute. DevisPropre remplace Excel, Word et le papier sans devenir une usine à gaz.`,
    ],
    pricingTitle: `Tarifs pour les artisans à ${city.label}`,
    pricingParagraph: `Essai gratuit 15 jours sur le plan Starter, puis 19€/mois : devis illimités, WhatsApp, factures TVA 2018, relances J+3. Idéal pour un ${trade.label.toLowerCase()} solo ou une petite équipe en ${city.region}. Plan Gratuit : 3 devis/mois après essai.`,
    faqTitle: `Questions fréquentes — ${trade.label} à ${city.label}`,
    faq: [
      {
        q: `Un ${trade.label.toLowerCase()} à ${city.label} peut-il facturer avec DevisPropre ?`,
        a: `Oui, à partir du plan Starter. Le devis accepté se convertit en facture verrouillée avec attestation PDF et chaînage SHA-256, conforme à la loi anti-fraude TVA 2018.`,
      },
      {
        q: `Combien de temps pour envoyer un devis à un client à ${city.label} ?`,
        a: `Environ 2 minutes depuis votre téléphone : client, prestations, prix, PDF. Le partage WhatsApp est disponible dès le plan Starter.`,
      },
    ],
  };
}

export function getTradeOnlySections(trade: TradeMeta): Omit<LocalPageSections, "whyTitle"> & { whyTitle: string } {
  const tradeParas = TRADE_DEEP[trade.slug] ?? TRADE_DEEP.plombier;
  return {
    whyTitle: `Pourquoi DevisPropre pour les ${trade.plural.toLowerCase()} ?`,
    whyParagraphs: tradeParas,
    featuresTitle: `Fonctionnalités pour ${trade.plural.toLowerCase()}`,
    featuresParagraphs: [
      "Devis PDF avec mentions légales, verrouillage à l'envoi, acceptation client en ligne, conversion facture conforme, relance J+3 et partage WhatsApp (Starter).",
    ],
    workflowTitle: `Créer un devis ${trade.label.toLowerCase()} en 3 étapes`,
    workflowSteps: [
      "Inscription + fiche entreprise (SIRET, TVA).",
      "Saisie client et lignes de prestation.",
      "PDF + envoi WhatsApp ou email.",
    ],
    marketTitle: `Devis ${trade.label.toLowerCase()} en France`,
    marketParagraphs: [
      `${trade.description} DevisPropre couvre toutes les régions avec le même outil mobile-first.`,
    ],
    pricingTitle: "Tarifs",
    pricingParagraph: "Essai 15 jours Starter gratuit, puis 19€/mois. Voir la page tarifs pour comparer Gratuit, Starter et Pro.",
    faqTitle: `FAQ ${trade.plural}`,
    faq: [
      {
        q: `DevisPropre convient-il aux ${trade.plural.toLowerCase()} ?`,
        a: `Oui : lignes détaillées, TVA ou franchise, PDF pro, facturation conforme après acceptation du devis.`,
      },
    ],
  };
}

/** Compte approximatif de mots pour contrôle éditorial. */
export function countWords(texts: string[]): number {
  return texts.join(" ").split(/\s+/).filter(Boolean).length;
}
