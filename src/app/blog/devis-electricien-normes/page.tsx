import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { BlogArticleJsonLd, blogArticleMeta } from "@/components/seo/BlogArticleJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis électricien : chiffrer une mise aux normes NF C 15-100",
  description:
    "Méthode de chiffrage pour électriciens : diagnostic, postes tableau, différentiel 30 mA, GTL, TVA 10 % rénovation et exemple chiffré T2 copropriété.",
  path: "/blog/devis-electricien-normes",
  keywords: [
    "devis électricien",
    "mise aux normes électricité",
    "NF C 15-100 devis",
    "prix électricien rénovation",
    "devis tableau électrique",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: "Devis électricien normes", path: "/blog/devis-electricien-normes" },
];

const ARTICLE = blogArticleMeta(ROUTES.blogDevisElectricien)!;

export default function BlogDevisElectricienPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />
      <BlogArticleJsonLd article={ARTICLE} />

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
          <span>Devis électricien normes</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Devis électricien : chiffrer une mise aux normes NF C 15-100
        </h1>
        <p className="text-lead mt-4 font-light">
          La mise aux normes est le chantier le plus mal chiffré en électricité : trop bas, vous
          perdez des heures sur des oublis ; trop haut, le client compare avec un voisin qui
          &laquo;&nbsp;remplace juste le tableau&nbsp;&raquo;. Voici une structure de devis
          reproductible, conforme aux attentes des particuliers et des syndics.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Commencer par un diagnostic écrit</h2>
        <p className="text-body mt-4 leading-relaxed">
          Avant tout chiffrage, relevez l&apos;état du tableau (marque, calage disjoncteurs,
          présence différentiel 30 mA, liaison équipotentielle SDB), l&apos;âge de
          l&apos;installation, les circuits existants et les points de non-conformité visibles.
          Ce diagnostic peut être facturé à part ou intégré au devis global — mais il doit
          apparaître noir sur blanc pour justifier le montant face à un client sceptique.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Découper le devis en postes NF C 15-100</h2>
        <p className="text-body mt-4 leading-relaxed">
          Évitez une ligne unique &laquo;&nbsp;mise aux normes complète&nbsp;&raquo;. Structurez
          au minimum :
        </p>
        <ul className="text-body mt-4 list-disc space-y-2 pl-6">
          <li>Remplacement ou rénovation du tableau (GTL, porte, étiquetage)</li>
          <li>Disjoncteur de branchement ou disjoncteur différentiel 30 mA type A ou AC selon cas</li>
          <li>Protection des circuits (prises, éclairage, gros appareils)</li>
          <li>Mise à la terre et prise de terre si absente ou insuffisante</li>
          <li>Repérage des circuits et schéma unifilaire remis au client</li>
          <li>Main-d&apos;œuvre dépose, pose, essais et PV de conformité Consuel si requis</li>
        </ul>
        <p className="text-body mt-4 leading-relaxed">
          Chaque poste porte sa TVA (10 % en rénovation logement &gt; 2 ans, 20 % sur neuf ou
          parties non éligibles). Le client comprend le détail ; vous limitez les litiges sur
          les &laquo;&nbsp;extras&nbsp;&raquo; découverts en cours de chantier.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Exemple chiffré : T2 en copropriété</h2>
        <p className="text-body mt-4 leading-relaxed">
          Pour un T2 de 55 m² (tableau vétuste, pas de différentiel, prises sans terre en
          chambres), comptez typiquement : fourniture tableau neuf 2 rangées, 2
          différentiels 30 mA, 8 disjoncteurs divisionnaires, repiquage partiel sur 3 pièces,
          essais d&apos;isolement, étiquetage. Ajoutez un forfait déplacement et une marge
          imprévus de 10 % sur la MO si gaines encastrées non cartographiées. Indiquez une
          validité de 30 jours et un acompte matériel à la commande.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Mentions obligatoires sur le devis</h2>
        <p className="text-body mt-4 leading-relaxed">
          SIRET, adresse, durée de validité, conditions de paiement, TVA par ligne ou taux
          global, référence aux normes applicables (NF C 15-100), exclusion des murs à ouvrir
          non visibles lors de la visite. Un PDF structuré rassure le syndic et accélère la
          signature en AG ou chez le particulier.
        </p>

        <h2 className="heading-section mt-12 text-xl">5. Envoyer le devis le jour de la visite</h2>
        <p className="text-body mt-4 leading-relaxed">
          En électricité, le client compare souvent trois devis la même semaine. Rédigez sur
          place depuis votre téléphone, envoyez le PDF par WhatsApp avec un lien
          d&apos;acceptation, et programmez une relance J+3 si pas de réponse. C&apos;est le
          standard attendu en 2026 — papier et Word mal formatés vous font perdre des parts de
          marché face aux artisans plus réactifs.
        </p>

        <p className="text-body mt-10 rounded-lg bg-[var(--surface-muted)] px-4 py-4 text-sm">
          <strong>Passer à l&apos;action :</strong>{" "}
          <Link href={ROUTES.creerDevis} className="link-underline font-medium">
            Créer un devis électricien gratuit
          </Link>
          {" · "}
          <Link href={ROUTES.guideDevisConforme} className="link-underline font-medium">
            Guide devis conforme
          </Link>
        </p>

        <GuideRelatedLinks current={ROUTES.blogDevisElectricien} />
      </article>
    </>
  );
}
