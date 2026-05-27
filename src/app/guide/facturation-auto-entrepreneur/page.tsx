import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Facturation auto-entrepreneur artisan",
  description:
    "Guide facturation auto-entrepreneur BTP : devis accepté, facture conforme, numérotation, TVA franchise ou assujetti, archivage légal. Outil DevisPropre.",
  path: "/guide/facturation-auto-entrepreneur",
  keywords: ["facturation auto entrepreneur", "facture artisan", "devis auto entrepreneur BTP"],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Guides", path: ROUTES.guideDevisConforme },
  { name: "Facturation auto-entrepreneur", path: ROUTES.guideFacturationAe },
];

export default function GuideFacturationAePage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="heading-hero mt-4 text-3xl sm:text-4xl">
          Facturation auto-entrepreneur : le guide pratique BTP
        </h1>
        <p className="text-lead mt-4 font-light">
          En micro-entreprise, la facture n&apos;est pas une formalité administrative — c&apos;est votre
          preuve de revenu et votre bouclier en cas de contrôle. Voici comment enchaîner proprement
          devis, facture et conformité TVA 2018.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Numérotation chronologique</h2>
        <p className="text-body mt-4 leading-relaxed">
          Chaque facture doit porter un numéro unique et chronologique, sans trou ni doublon. DevisPropre
          génère automatiquement la séquence à partir de vos émissions. Ne réutilisez jamais un numéro,
          même pour une facture annulée — l&apos;annulation se trace, le numéro reste dans l&apos;historique.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Du devis accepté à la facture</h2>
        <p className="text-body mt-4 leading-relaxed">
          La ressaisie manuelle est la première source d&apos;erreur : montant HT différent, TVA oubliée,
          client mal orthographié. Convertissez le devis accepté en facture brouillon, vérifiez une dernière
          fois, puis émettez. À l&apos;émission, le document se verrouille — conformément à la loi
          anti-fraude à la TVA.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Franchise en base vs TVA</h2>
        <p className="text-body mt-4 leading-relaxed">
          En franchise, mentionnez l&apos;article 293 B du CGI sur chaque facture. Assujetti, indiquez le
          taux par ligne (10 % rénovation habitation, 20 % par défaut). Configurez votre statut une fois
          dans DevisPropre — il s&apos;applique à tous vos documents.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Conservation et archivage</h2>
        <p className="text-body mt-4 leading-relaxed">
          Les factures émises doivent être conservées dix ans, inaltérables. L&apos;empreinte SHA-256 et
          l&apos;archivage PDF à l&apos;émission répondent à cette exigence. Téléchargez aussi l&apos;attestation
          individuelle de conformité pour chaque facture Starter+.
        </p>

        <div className="not-prose mt-10 flex flex-wrap gap-3">
          <Link href={ROUTES.inscription} className="ui-btn-primary px-6 py-3">
            Essai gratuit 15 jours
          </Link>
          <Link href={ROUTES.guideDevisConforme} className="ui-btn-outline px-6 py-3">
            Guide devis conforme
          </Link>
        </div>

        <GuideRelatedLinks current={ROUTES.guideFacturationAe} />
      </article>
    </>
  );
}
