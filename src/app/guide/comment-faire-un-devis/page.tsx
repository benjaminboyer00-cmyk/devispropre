import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { GuideArticleJsonLd, guideArticleMeta } from "@/components/seo/GuideArticleJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import {
  COMMENT_FAIRE_DEVIS_FAQ,
  jsonLdBreadcrumbList,
  jsonLdFaqFromItems,
  jsonLdHowToFaireUnDevis,
  pageMetadata,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Comment faire un devis — guide artisan 2026",
  description:
    "Apprenez à faire un devis professionnel : client, prestations, TVA, mentions légales et envoi PDF. Méthode Word, Excel ou logiciel devis facile pour artisans BTP.",
  path: ROUTES.guideCommentFaireDevis,
  keywords: [
    "comment faire un devis",
    "faire un devis artisan",
    "modèle devis gratuit",
    "devis auto entrepreneur",
    "rédiger un devis BTP",
    "devis facile",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Guides", path: ROUTES.blog },
  { name: "Comment faire un devis", path: ROUTES.guideCommentFaireDevis },
];

const ARTICLE = guideArticleMeta(ROUTES.guideCommentFaireDevis)!;

export default function GuideCommentFaireDevisPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />
      <GuideArticleJsonLd article={ARTICLE} />
      <JsonLd data={jsonLdHowToFaireUnDevis()} />
      <JsonLd data={jsonLdFaqFromItems(COMMENT_FAIRE_DEVIS_FAQ)} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle not-prose">
          <Link href="/" className="link-blue hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link href={ROUTES.blog} className="link-blue hover:underline">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span>Comment faire un devis</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Comment faire un devis quand on est artisan
        </h1>
        <p className="text-lead mt-4 font-light">
          Que vous soyez plombier, électricien, peintre ou auto-entrepreneur du bâtiment, un devis
          clair rassure le client et accélère la signature. Ce guide explique comment faire un devis
          étape par étape — à la main ou avec un{" "}
          <Link href={ROUTES.devisFacile} className="link-underline font-medium">
            logiciel de devis facile
          </Link>
          .
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Avant de rédiger : bien cadrer le chantier</h2>
        <p className="text-body mt-4 leading-relaxed">
          Un devis commence sur le terrain, pas devant l&apos;écran. Notez la nature des travaux
          (dépannage, rénovation, neuf), la surface ou le périmètre, les contraintes d&apos;accès et
          les matériaux envisagés. Demandez au client s&apos;il compare plusieurs artisans : un
          document lisible et détaillé fait souvent la différence entre un « je rappelle » et un
          silence de trois semaines.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Identifiez aussi qui valide : le particulier, le syndic de copropriété ou un maître
          d&apos;ouvrage. L&apos;adresse d&apos;intervention doit figurer explicitement sur le devis
          pour éviter les litiges sur le lieu des travaux.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Structurer les lignes de prestation</h2>
        <p className="text-body mt-4 leading-relaxed">
          Chaque ligne doit comporter une description précise, une quantité, un prix unitaire hors
          taxes et un taux de TVA. Évitez les libellés flous (« divers », « travaux »). Préférez :
          fourniture robinetterie, main-d&apos;œuvre pose, déplacement, évacuation des déchets.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Le client comprend le prix ; vous vous protégez si le matériel augmente. Pour un devis
          électricité, séparez diagnostic, tableau, câblage et finitions. Pour la peinture,
          distinguez préparation des supports et application des couches.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. TVA et statut artisan</h2>
        <p className="text-body mt-4 leading-relaxed">
          En franchise en base de TVA (micro-entreprise sous seuils), vous ne facturez pas la TVA
          mais devez le mentionner sur le devis (art. 293 B du CGI). Si vous êtes assujetti, chaque
          ligne porte le bon taux : 10 % pour certains travaux de rénovation dans le logement, 20 %
          par défaut, 5,5 % pour l&apos;amélioration énergétique dans certains cas.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Une erreur de taux sur le devis se reproduit sur la facture. Vérifiez votre statut une
          fois dans votre outil plutôt qu&apos;à chaque document. Consultez notre{" "}
          <Link href={ROUTES.guideTvaArtisan} className="link-underline font-medium">
            guide TVA artisan travaux
          </Link>{" "}
          pour les cas courants.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Mentions obligatoires à ne pas oublier</h2>
        <p className="text-body mt-4 leading-relaxed">
          Votre devis doit identifier votre entreprise (raison sociale, SIRET, adresse), le client,
          la date, la durée de validité (souvent 30 jours en BTP) et les totaux HT, TVA et TTC. Les
          conditions de paiement (acompte, solde à réception) peuvent figurer en bas de page.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Pour la liste complète et les spécificités BTP (assurance décennale le cas échéant), voir
          le guide{" "}
          <Link href={ROUTES.guideDevisConforme} className="link-underline font-medium">
            devis artisan conforme
          </Link>{" "}
          et les{" "}
          <Link href={ROUTES.guideMentionsDevis} className="link-underline font-medium">
            mentions obligatoires
          </Link>
          .
        </p>

        <h2 className="heading-section mt-12 text-xl">5. Word, Excel ou logiciel de devis ?</h2>
        <p className="text-body mt-4 leading-relaxed">
          <strong>Word ou PDF manuel</strong> : gratuit au départ, mais lent, source d&apos;erreurs
          de calcul et de mise en page amateur. <strong>Excel</strong> : pratique pour chiffrer, mais
          le PDF final reste artisanal et la facture demande une ressaisie risquée.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          <strong>Un logiciel de devis pour artisan</strong> comme DevisPropre combine saisie
          mobile, calcul TVA automatique, PDF avec logo et passage en facture conforme TVA 2018 sans
          recopier les lignes. C&apos;est la voie la plus rapide si vous enchaînez plusieurs devis
          par semaine sur chantier.
        </p>

        <h2 className="heading-section mt-12 text-xl">6. Envoyer le devis et obtenir une réponse</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le PDF reste le format de référence : lisible sur smartphone, archivable par le client,
          transmissible au syndic. WhatsApp accélère la décision si le message est professionnel
          (montant, validité, lien). Relancer à J+3 sans insister augmente le taux d&apos;acceptation
          — surtout quand le client a comparé trois artisans le week-end.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Conservez une trace de l&apos;envoi (date, canal). Quand le client accepte, passez à la
          facture sans modifier les montants à la main : c&apos;est une obligation comptable depuis la
          loi anti-fraude à la TVA de 2018.
        </p>

        <h2 className="heading-section mt-12 text-xl">Questions fréquentes</h2>
        <dl className="not-prose mt-6 space-y-6">
          {COMMENT_FAIRE_DEVIS_FAQ.map((item) => (
            <div key={item.q} className="ui-card-padded">
              <dt className="heading font-semibold">{item.q}</dt>
              <dd className="text-body mt-2 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>

        <div className="not-prose mt-12 flex flex-wrap gap-3">
          <Link href={ROUTES.creerDevis} className="ui-btn-primary px-6 py-3">
            Faire mon devis gratuit
          </Link>
          <Link href={ROUTES.devisFacile} className="ui-btn-outline px-6 py-3">
            Devis facile en 2 min
          </Link>
        </div>

        <GuideRelatedLinks current={ROUTES.guideCommentFaireDevis} />
      </article>
    </>
  );
}
