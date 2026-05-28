import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Facture auto-entrepreneur 2026 : obligations et modèle",
  description:
    "Devis vs facture auto-entrepreneur, mentions obligatoires 2026, franchise TVA art. 293 B, numérotation séquentielle et conformité anti-fraude à la TVA.",
  path: "/blog/facture-auto-entrepreneur-2026",
  keywords: [
    "facture auto entrepreneur 2026",
    "devis facture auto-entrepreneur",
    "mentions obligatoires facture",
    "franchise TVA auto-entrepreneur",
    "différence devis facture",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: "Facture auto-entrepreneur 2026", path: "/blog/facture-auto-entrepreneur-2026" },
];

export default function BlogFactureAe2026Page() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle not-prose">
          <Link href="/" className="link-blue hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="link-blue hover:underline">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span>Facture auto-entrepreneur 2026</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Facture auto-entrepreneur 2026 : ce que la loi exige vraiment
        </h1>
        <p className="text-lead mt-4 font-light">
          Le statut auto-entrepreneur simplifie les déclarations, pas les règles de facturation.
          En 2026, un artisan en micro-entreprise doit toujours distinguer devis et facture,
          respecter la numérotation chronologique et, depuis 2018, la conformité anti-fraude à la
          TVA dès qu&apos;il est assujetti.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Devis vs facture : deux rôles différents</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le <strong>devis</strong> est une proposition commerciale : il engage vos prix et
          conditions avant travaux. La <strong>facture</strong> est le document comptable qui
          constate la prestation réalisée et ouvre le droit au paiement. Un devis accepté ne remplace
          pas une facture — surtout si vous êtes assujetti à la TVA ou si votre client est une
          entreprise qui récupère la TVA.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Mentions obligatoires sur une facture AE en 2026</h2>
        <p className="text-body mt-4 leading-relaxed">
          Votre facture doit comporter : date d&apos;émission, numéro unique et séquentiel, identité
          complète (nom, SIRET, adresse), identité du client, description des prestations, montants
          HT et TTC, taux de TVA ou mention de franchise en base (art. 293 B du CGI), conditions de
          paiement et pénalités de retard le cas échéant. Pour les artisans BTP, l&apos;adresse du
          chantier évite les litiges avec le syndic ou le maître d&apos;ouvrage.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Franchise TVA ou assujetti : impact concret</h2>
        <p className="text-body mt-4 leading-relaxed">
          Tant que vous restez sous les seuils de franchise, vous facturez sans TVA et mentionnez
          « TVA non applicable, art. 293 B du CGI ». Au-delà, vous devez facturer avec TVA,
          déclarer les encaissements et utiliser un logiciel conforme (inaltérabilité, conservation,
          traçabilité). La bascule change vos prix affichés : prévenez vos clients et mettez à jour
          vos modèles de devis.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Numérotation et chaînage devis → facture</h2>
        <p className="text-body mt-4 leading-relaxed">
          Les numéros de facture doivent être chronologiques sans trou (FAC-2026-001, 002…). La
          bonne pratique : convertir un devis accepté en facture brouillon sans ressaisie, figer
          les montants et archiver un PDF horodaté. Toute modification après émission est interdite
          pour un document conforme TVA 2018.
        </p>

        <h2 className="heading-section mt-12 text-xl">5. Erreurs fréquentes à éviter</h2>
        <ul className="text-body mt-4 list-disc space-y-2 pl-6">
          <li>Facturer avant la fin des travaux sans acompte formalisé</li>
          <li>Réutiliser un numéro de facture ou sauter une séquence</li>
          <li>Oublier la mention franchise TVA alors que vous n&apos;êtes pas assujetti</li>
          <li>Modifier une facture déjà envoyée au lieu d&apos;émettre un avoir</li>
          <li>Conserver uniquement des photos WhatsApp sans PDF archivé</li>
        </ul>

        <p className="text-body mt-10 rounded-lg bg-[var(--surface-muted)] px-4 py-4 text-sm">
          <strong>Aller plus loin :</strong>{" "}
          <Link href={ROUTES.guideFacturationAe} className="link-underline font-medium">
            Guide facturation auto-entrepreneur
          </Link>
          {" · "}
          <Link href={ROUTES.conformite} className="link-underline font-medium">
            Conformité TVA 2018
          </Link>
        </p>

        <GuideRelatedLinks current={ROUTES.blogFactureAe2026} />
      </article>
    </>
  );
}
