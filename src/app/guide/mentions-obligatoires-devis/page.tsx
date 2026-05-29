import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { GuideArticleJsonLd, guideArticleMeta } from "@/components/seo/GuideArticleJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mentions obligatoires sur un devis artisan",
  description:
    "Liste complète des mentions légales obligatoires sur un devis BTP : SIRET, TVA, validité, coordonnées, détail des prestations. Checklist 2026.",
  path: "/guide/mentions-obligatoires-devis",
  keywords: ["mentions obligatoires devis", "devis artisan légal", "modèle devis BTP", "SIRET devis"],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Guides", path: ROUTES.blog },
  { name: "Mentions obligatoires devis", path: ROUTES.guideMentionsDevis },
];

const ARTICLE = guideArticleMeta(ROUTES.guideMentionsDevis)!;

export default function GuideMentionsDevisPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />
      <GuideArticleJsonLd article={ARTICLE} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="heading-hero mt-4 text-3xl sm:text-4xl">
          Mentions obligatoires sur un devis artisan
        </h1>
        <p className="text-lead mt-4 font-light">
          Un devis incomplet peut être rejeté par le client, contesté en cas de litige ou invalidé
          lors d&apos;un contrôle. Voici la checklist des mentions à ne jamais oublier.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Identité de l&apos;entreprise</h2>
        <ul className="text-body mt-4 list-disc space-y-2 pl-5">
          <li>Raison sociale ou nom + prénom (auto-entrepreneur)</li>
          <li>Adresse du siège ou domicile professionnel</li>
          <li>Numéro SIRET (14 chiffres)</li>
          <li>Numéro de TVA intracommunautaire si assujetti</li>
          <li>Forme juridique et capital social le cas échéant</li>
        </ul>

        <h2 className="heading-section mt-12 text-xl">2. Coordonnées client et date</h2>
        <p className="text-body mt-4 leading-relaxed">
          Identifiez clairement le client (nom, adresse du chantier si différente). Datez le devis
          et indiquez sa durée de validité — 30 jours est la pratique courante en BTP.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Détail des prestations et prix</h2>
        <p className="text-body mt-4 leading-relaxed">
          Chaque ligne doit comporter une description précise, une quantité, un prix unitaire HT,
          le taux de TVA applicable et le montant TTC. Le total HT, TVA et TTC doit figurer en
          bas de document. En franchise en base, mentionnez l&apos;article 293 B du CGI.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Conditions et signature</h2>
        <p className="text-body mt-4 leading-relaxed">
          Précisez les modalités de paiement (acompte, solde), les délais d&apos;intervention et
          la mention « Bon pour accord » avec date et signature du client. DevisPropre génère
          automatiquement ces blocs à partir de votre fiche entreprise.
        </p>

        <div className="not-prose mt-10 flex flex-wrap gap-3">
          <Link href={ROUTES.inscription} className="ui-btn-primary px-6 py-3">
            Créer un devis conforme
          </Link>
          <Link href={ROUTES.guideDevisConforme} className="ui-btn-outline px-6 py-3">
            Guide devis complet
          </Link>
        </div>

        <GuideRelatedLinks current={ROUTES.guideMentionsDevis} />
      </article>
    </>
  );
}
