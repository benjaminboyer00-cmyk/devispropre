import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { GuideArticleJsonLd, guideArticleMeta } from "@/components/seo/GuideArticleJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, jsonLdHowToCreateDevis, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Comment faire un devis artisan conforme",
  description:
    "Guide complet 2026 : mentions obligatoires, TVA, durée de validité, acceptation client et passage en facture conforme TVA 2018. Modèle et bonnes pratiques pour artisans BTP.",
  path: "/guide/devis-artisan-conforme",
  keywords: [
    "devis artisan conforme",
    "mentions obligatoires devis",
    "modèle devis BTP",
    "devis auto entrepreneur",
    "facture après devis",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Guides", path: ROUTES.blog },
  { name: "Devis artisan conforme", path: "/guide/devis-artisan-conforme" },
];

const ARTICLE = guideArticleMeta(ROUTES.guideDevisConforme)!;

export default function GuideDevisConformePage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />
      <GuideArticleJsonLd article={ARTICLE} />
      <JsonLd data={jsonLdHowToCreateDevis()} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle not-prose">
          <Link href="/" className="link-blue hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span>Guide devis artisan</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Comment faire un devis artisan conforme en 2026
        </h1>
        <p className="text-lead mt-4 font-light">
          Un devis mal rédigé coûte des signatures perdues, des litiges TVA et des heures de
          ressaisie. Ce guide résume les obligations légales et les bonnes pratiques terrain pour
          plombiers, électriciens, peintres et tous artisans du BTP.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Mentions obligatoires sur un devis</h2>
        <p className="text-body mt-4 leading-relaxed">
          Même si le devis n&apos;a pas la même force comptable qu&apos;une facture, il engage votre
          responsabilité commerciale. Votre document doit identifier clairement votre entreprise et
          votre client, décrire les prestations, les quantités, les prix unitaires hors taxes, le
          taux de TVA applicable (ou la mention de franchise en base art. 293 B du CGI), le total
          TTC, la durée de validité et les conditions de paiement éventuelles.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Côté artisan, le SIRET, la raison sociale, l&apos;adresse du siège et, le cas échéant, le
          numéro de TVA intracommunautaire sont indispensables. Côté client, le nom et l&apos;adresse
          d&apos;intervention évitent les ambiguïtés — surtout en copropriété où le syndic vérifie
          chaque ligne.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Devis vs facture : ne pas confondre</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le devis est une proposition commerciale. La facture est un document comptable soumis à la
          loi anti-fraude à la TVA depuis 2018 : inaltérabilité, sécurisation, conservation et
          archivage. Un devis accepté sert de base à la facture, mais une fois la facture émise,
          ses montants ne doivent plus être modifiables. D&apos;où l&apos;intérêt d&apos;un outil qui
          verrouille le devis à l&apos;envoi et chaîne la facture avec empreinte SHA-256.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Structurer les lignes de prestation</h2>
        <p className="text-body mt-4 leading-relaxed">
          Évitez les libellés vagues (« travaux divers »). Préférez des postes séparés : fourniture,
          main-d&apos;œuvre, déplacement, évacuation des gravats. Le client comprend le prix ; vous
          vous protégez en cas de surcoût matériel. Pour la peinture, distinguez préparation et
          finition. Pour l&apos;électricité, séparez diagnostic, matériel et pose.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Indiquez une durée de validité (30 jours est courant en BTP). Au-delà, les prix matériaux
          peuvent évoluer — un devis expiré doit être refait plutôt que modifié à la main.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. TVA : franchise ou assujetti</h2>
        <p className="text-body mt-4 leading-relaxed">
          En franchise en base, vous ne facturez pas la TVA mais devez le mentionner explicitement.
          Assujetti, chaque ligne porte un taux cohérent (10 % rénovation, 20 % par défaut selon
          cas). Une erreur de taux sur le devis se reproduit sur la facture — vérifiez votre statut
          une fois dans votre logiciel, pas à chaque document.
        </p>

        <h2 className="heading-section mt-12 text-xl">5. Envoi, acceptation et relance</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le PDF reste le format de référence : lisible sur mobile, archivable par le client,
          transmissible au syndic ou à la banque pour un prêt travaux. WhatsApp accélère la
          décision si le message est professionnel (montant, lien, validité). Relancer à J+3 sans
          agressivité augmente le taux de conversion — surtout quand le client a comparé trois
          artisans le week-end.
        </p>

        <h2 className="heading-section mt-12 text-xl">6. Passer du devis à la facture sans ressaisie</h2>
        <p className="text-body mt-4 leading-relaxed">
          La ressaisie manuelle Excel → facture est source d&apos;erreurs et de non-conformité.
          Idéalement, le devis accepté génère une facture brouillon avec les mêmes lignes, puis
          l&apos;émission verrouille le document définitif. DevisPropre suit ce flux : devis PDF →
          acceptation client → facture conforme TVA 2018 avec attestation téléchargeable.
        </p>

        <h2 className="heading-section mt-12 text-xl">7. Checklist avant envoi</h2>
        <ul className="text-body mt-4 list-disc space-y-2 pl-5">
          <li>SIRET et coordonnées à jour</li>
          <li>Client et adresse chantier corrects</li>
          <li>Lignes détaillées, totaux HT/TVA/TTC vérifiés</li>
          <li>Durée de validité renseignée</li>
          <li>PDF lisible sur smartphone</li>
          <li>Trace de l&apos;envoi (email, WhatsApp, date)</li>
        </ul>

        <div className="not-prose mt-12 flex flex-wrap gap-3">
          <Link href={ROUTES.inscription} className="ui-btn-primary px-6 py-3">
            Créer mon premier devis
          </Link>
          <Link href={ROUTES.conformite} className="ui-btn-outline px-6 py-3">
            Conformité TVA 2018
          </Link>
        </div>

        <GuideRelatedLinks current={ROUTES.guideDevisConforme} />
      </article>
    </>
  );
}
