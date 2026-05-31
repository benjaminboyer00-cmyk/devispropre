import Link from "next/link";
import { TrackLink } from "@/components/analytics/TrackLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import {
  DEVIS_FACILE_FAQ,
  jsonLdBreadcrumbList,
  jsonLdFaqFromItems,
  jsonLdHowToCreateDevis,
  jsonLdSoftwareApplication,
  pageMetadata,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis facile pour artisans — pro en 2 minutes",
  description:
    "Logiciel de devis facile pour artisans BTP : plus simple qu'Excel, PDF pro, WhatsApp, facture conforme TVA 2018. Essai 15 jours gratuit. Plombier, électricien, peintre.",
  path: ROUTES.devisFacile,
  keywords: [
    "devis facile",
    "devis facile artisan",
    "logiciel devis facile",
    "application devis artisan",
    "faire un devis rapidement",
    "devis BTP simple",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Devis facile", path: ROUTES.devisFacile },
];

const COMPARISON = [
  {
    method: "Word / papier",
    problem: "Mise en page amateur, calculs à la main, devis perdus dans la boîte à gants.",
  },
  {
    method: "Excel",
    problem: "Formules TVA fragiles, PDF peu pro, ressaisie obligatoire pour la facture.",
  },
  {
    method: "DevisPropre",
    problem: "Saisie mobile en 2 min, PDF logo + SIRET, WhatsApp et facture conforme en 1 clic.",
  },
] as const;

export default function DevisFacilePage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />
      <JsonLd data={jsonLdSoftwareApplication()} />
      <JsonLd data={jsonLdHowToCreateDevis()} />
      <JsonLd data={jsonLdFaqFromItems(DEVIS_FACILE_FAQ)} />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle">
          <Link href="/" className="link-blue hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span>Devis facile</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Devis facile pour artisans — sans Excel ni formation
        </h1>
        <p className="text-lead mt-4 font-light">
          Vous cherchez un <strong>devis facile</strong> à faire depuis le chantier ? DevisPropre
          remplace Word et les tableurs : tapez client et prestations, obtenez un PDF professionnel
          conforme, partagez-le par WhatsApp et facturez sans ressaisie.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <TrackLink
            href={ROUTES.creerDevis}
            className="ui-btn-primary px-6 py-3"
            event="CTA Creer Devis"
            eventProps={{ location: "devis-facile" }}
          >
            Créer mon devis gratuit
          </TrackLink>
          <Link href={ROUTES.guideCommentFaireDevis} className="ui-btn-outline px-6 py-3">
            Comment faire un devis
          </Link>
        </div>

        <h2 className="heading-section mt-14 text-xl">Pourquoi « devis facile » ne veut pas dire amateur</h2>
        <p className="text-body mt-4 leading-relaxed">
          Beaucoup d&apos;artisans cherchent un <strong>logiciel de devis facile</strong> parce
          qu&apos;ils n&apos;ont pas le temps de se former à un ERP. Pourtant un devis trop simpliste
          (SMS, photo de griffonnage) fait fuir les clients exigeants et complique la facturation
          ensuite.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          DevisPropre vise le bon équilibre : interface minimaliste pensée mobile, mais mentions
          légales, TVA, validité et PDF verrouillé à l&apos;envoi. Vous gardez le côté « facile »
          sans passer pour un bricoleur face aux syndics et aux banques travaux.
        </p>

        <h2 className="heading-section mt-12 text-xl">Word, Excel ou DevisPropre ?</h2>
        <ul className="mt-6 space-y-4">
          {COMPARISON.map((row) => (
            <li key={row.method} className="ui-card-padded">
              <p className="heading font-semibold">{row.method}</p>
              <p className="text-body mt-2 text-sm leading-relaxed">{row.problem}</p>
            </li>
          ))}
        </ul>

        <h2 className="heading-section mt-12 text-xl">Comment faire un devis facilement en 3 étapes</h2>
        <ol className="text-body mt-6 list-decimal space-y-4 pl-5 leading-relaxed">
          <li>
            <strong>Saisissez le client et vos lignes</strong> — quantité, prix, TVA calculée
            automatiquement (franchise ou assujetti).
          </li>
          <li>
            <strong>Générez le PDF</strong> — logo, SIRET, totaux HT/TTC, durée de validité.
          </li>
          <li>
            <strong>Envoyez et suivez</strong> — WhatsApp, relance J+3, acceptation client en ligne,
            facture conforme TVA 2018 en un clic.
          </li>
        </ol>
        <p className="text-body mt-4 leading-relaxed">
          Besoin du détail juridique ? Lisez notre guide{" "}
          <Link href={ROUTES.guideCommentFaireDevis} className="link-underline font-medium">
            comment faire un devis
          </Link>{" "}
          ou explorez les pages{" "}
          <Link href={ROUTES.devisArtisanHub} className="link-underline font-medium">
            devis par métier
          </Link>{" "}
          (plombier, électricien, peintre…).
        </p>

        <h2 className="heading-section mt-12 text-xl">Pour quels artisans ?</h2>
        <p className="text-body mt-4 leading-relaxed">
          Plombiers, électriciens, peintres, maçons, couvreurs, chauffagistes, auto-entrepreneurs du
          BTP : si vous facturez des travaux chez des particuliers ou en copropriété, DevisPropre
          couvre votre flux devis → facture. Pas de module comptable lourd — juste ce qu&apos;il faut
          pour signer plus vite sur le terrain.
        </p>
        <p className="text-body mt-4 leading-relaxed">
          Conformité loi anti-fraude TVA 2018 : verrouillage à l&apos;émission, empreinte SHA-256,
          chaînage des factures et attestation PDF.{" "}
          <Link href={ROUTES.conformite} className="link-underline font-medium">
            En savoir plus
          </Link>
          .
        </p>

        <h2 className="heading-section mt-12 text-xl">Questions fréquentes</h2>
        <dl className="mt-6 space-y-6">
          {DEVIS_FACILE_FAQ.map((item) => (
            <div key={item.q} className="ui-card-padded">
              <dt className="heading font-semibold">{item.q}</dt>
              <dd className="text-body mt-2 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>

        <section className="ui-cta-band mt-14 rounded-xl px-6 py-10 text-center">
          <p className="text-xl font-bold leading-snug sm:text-2xl">
            Votre prochain devis facile, en 2 minutes chrono
          </p>
          <TrackLink
            href={ROUTES.inscription}
            className="ui-btn-inverse ui-btn-lg mt-8 inline-flex"
            event="CTA Inscription"
            eventProps={{ location: "devis-facile-footer" }}
          >
            Essai gratuit 15 jours
          </TrackLink>
        </section>
      </article>
    </>
  );
}
