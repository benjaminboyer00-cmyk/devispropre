import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { BlogArticleJsonLd, blogArticleMeta } from "@/components/seo/BlogArticleJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Comment chiffrer un chantier de plomberie en 2026",
  description:
    "Méthode de chiffrage pour plombiers : diagnostic, fournitures, main-d'œuvre, déplacement et marge. Exemple de devis plombier avec postes détaillés et TVA travaux.",
  path: "/blog/devis-plombier-chiffrage",
  keywords: [
    "devis plombier",
    "chiffrer chantier plomberie",
    "prix plombier",
    "devis plombier Paris",
    "TVA travaux plomberie",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: "Chiffrage plomberie", path: "/blog/devis-plombier-chiffrage" },
];

const ARTICLE = blogArticleMeta(ROUTES.blogDevisPlombier)!;

export default function BlogDevisPlombierPage() {
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
          <span>Chiffrage plomberie</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Comment chiffrer un chantier de plomberie en 2026
        </h1>
        <p className="text-lead mt-4 font-light">
          Un devis plombier trop bas vous fait perdre de l&apos;argent ; trop haut, vous perdez le
          chantier. Voici une méthode reproductible pour chiffrer fuite, remplacement chauffe-eau,
          salle de bain complète ou rénovation réseau — sans oublier déplacement et imprévus.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Toujours partir du diagnostic</h2>
        <p className="text-body mt-4 leading-relaxed">
          Avant de chiffrer, isolez la cause : fuite visible, pression insuffisante, calcaire,
          réseau vétuste. Sur place, notez l&apos;accès (gainable, dalle béton, copropriété),
          l&apos;état des réseaux existants et les contraintes (horaires, coupure eau). Ce temps de
          diagnostic se facture — soit en forfait visite, soit intégré au devis si le client
          signe.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Découper le devis en postes clairs</h2>
        <p className="text-body mt-4 leading-relaxed">
          Évitez « travaux plomberie divers ». Structurez en lignes distinctes : fournitures
          (robinetterie, tube PER, collecteur), main-d&apos;œuvre pose, évacuation gravats,
          déplacement, mise en service et essai d&apos;étanchéité. Le client comprend le prix ; vous
          vous protégez si le matériel augmente entre le devis et la commande.
        </p>
        <ul className="text-body mt-4 list-disc space-y-2 pl-6">
          <li>Fourniture et pose robinet mitigeur : quantité 1, PU HT + TVA 10 % si logement &gt; 2 ans</li>
          <li>Remplacement groupe de sécurité chauffe-eau : main-d&apos;œuvre + pièce</li>
          <li>Déplacement zone urbaine : forfait ou km</li>
          <li>Essai pression et rapport photos : valeur perçue, litige évité</li>
        </ul>

        <h2 className="heading-section mt-12 text-xl">3. TVA travaux : 5,5 %, 10 % ou 20 % ?</h2>
        <p className="text-body mt-4 leading-relaxed">
          En rénovation de logement de plus de deux ans, la plomberie entre souvent dans le taux
          réduit à 10 % (travaux d&apos;amélioration). L&apos;isolation ou certains équipements
          énergétiques peuvent ouvrir le 5,5 %. Le taux normal à 20 % s&apos;applique aux locaux
          neufs ou non résidentiels. Mentionnez le taux par ligne et joignez l&apos;attestation
          simplifiée si le client en bénéficie.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Exemple chiffré : remplacement chauffe-eau</h2>
        <p className="text-body mt-4 leading-relaxed">
          Pour un cumulus 200 L en appartement (Paris ou province), comptez typiquement : dépose
          ancien ballon, fourniture neuf, raccordements, groupe de sécurité, mise en eau, essai —
          hors évacuation dalle si non accessible. Ajoutez 10 à 15 % de marge imprévus sur la
          main-d&apos;œuvre si accès difficile. Indiquez une validité de 30 jours et un acompte à
          la commande matériel.
        </p>

        <h2 className="heading-section mt-12 text-xl">5. Devis plombier [ville] : le réflexe mobile</h2>
        <p className="text-body mt-4 leading-relaxed">
          Sur chantier, le client attend un PDF le jour même. Rédigez le devis sur mobile, envoyez
          par WhatsApp avec un lien d&apos;acceptation, et conservez une trace horodatée. C&apos;est
          le standard attendu par les particuliers comme par les syndics de copropriété.
        </p>

        <p className="text-body mt-10 rounded-lg bg-[var(--surface-muted)] px-4 py-4 text-sm">
          <strong>Passer à l&apos;action :</strong>{" "}
          <Link href={ROUTES.creerDevis} className="link-underline font-medium">
            Créer un devis plombier gratuit
          </Link>
          {" · "}
          <Link href={ROUTES.guideTvaArtisan} className="link-underline font-medium">
            Guide TVA artisan
          </Link>
        </p>

        <GuideRelatedLinks current={ROUTES.blogDevisPlombier} />
      </article>
    </>
  );
}
