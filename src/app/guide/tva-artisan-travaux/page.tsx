import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "TVA artisan travaux — taux et conformité",
  description:
    "TVA 10 % ou 20 % sur travaux BTP ? Franchise en base, assujetti, devis et factures conformes loi anti-fraude 2018. Guide pratique pour artisans.",
  path: "/guide/tva-artisan-travaux",
  keywords: ["TVA artisan", "TVA travaux 10 pourcent", "franchise base TVA artisan", "facture TVA BTP"],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Guides", path: ROUTES.guideDevisConforme },
  { name: "TVA artisan travaux", path: ROUTES.guideTvaArtisan },
];

export default function GuideTvaArtisanPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="heading-hero mt-4 text-3xl sm:text-4xl">
          TVA artisan travaux : ce qu&apos;il faut savoir en 2026
        </h1>
        <p className="text-lead mt-4 font-light">
          La TVA sur les travaux BTP n&apos;est pas un détail comptable — une erreur sur le devis se
          répercute sur la facture verrouillée. Ce guide clarifie les taux, la franchise en base et
          la conformité anti-fraude.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. TVA 10 % vs 20 %</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le taux réduit à 10 % s&apos;applique aux travaux de rénovation dans un logement achevé depuis
          plus de deux ans (sous conditions de nature des travaux et d&apos;usage du logement). Le taux
          normal de 20 % couvre le neuf, certaines extensions et les prestations hors champ du taux réduit.
          Votre devis doit afficher le taux par ligne — le client et l&apos;administration doivent
          comprendre le calcul.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Franchise en base (art. 293 B)</h2>
        <p className="text-body mt-4 leading-relaxed">
          Tant que vous êtes en franchise, vous ne facturez pas la TVA mais devez le mentionner explicitement
          sur devis et factures. Dès le dépassement des seuils ou option pour la TVA, vos documents doivent
          évoluer — mettez à jour votre fiche entreprise dans DevisPropre avant la prochaine émission.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Loi anti-fraude TVA 2018</h2>
        <p className="text-body mt-4 leading-relaxed">
          Les logiciels de facturation doivent garantir inaltérabilité, sécurisation, conservation et
          archivage. DevisPropre verrouille les factures émises, calcule une empreinte SHA-256 et produit
          une attestation téléchargeable. Les devis verrouillés à l&apos;envoi préparent la chaîne
          documentaire.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Erreurs fréquentes à éviter</h2>
        <ul className="text-body mt-4 list-disc space-y-2 pl-5">
          <li>TVA 20 % appliquée à tort sur de la rénovation éligible au 10 %</li>
          <li>Oubli de la mention franchise en base</li>
          <li>Modification d&apos;une facture déjà émise (interdit — faire un avoir)</li>
          <li>Devis sans durée de validité ni détail des postes</li>
        </ul>

        <div className="not-prose mt-10 flex flex-wrap gap-3">
          <Link href={ROUTES.conformite} className="ui-btn-primary px-6 py-3">
            Voir la conformité DevisPropre
          </Link>
          <Link href={ROUTES.guideFacturationAe} className="ui-btn-outline px-6 py-3">
            Facturation auto-entrepreneur
          </Link>
        </div>

        <GuideRelatedLinks current={ROUTES.guideTvaArtisan} />
      </article>
    </>
  );
}
