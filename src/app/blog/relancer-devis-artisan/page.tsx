import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { BlogArticleJsonLd, blogArticleMeta } from "@/components/seo/BlogArticleJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Relancer un devis artisan sans être lourd (WhatsApp, email, J+3)",
  description:
    "Timing, formulation et suivi des devis en attente : relance J+3 automatique, message WhatsApp pré-rempli et méthode terrain pour artisans BTP.",
  path: "/blog/relancer-devis-artisan",
  keywords: [
    "relancer devis artisan",
    "devis sans réponse client",
    "relance devis WhatsApp",
    "suivi devis BTP",
    "devis en attente",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: "Relancer un devis", path: "/blog/relancer-devis-artisan" },
];

const ARTICLE = blogArticleMeta(ROUTES.blogRelancerDevis)!;

export default function BlogRelancerDevisPage() {
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
          <span>Relancer un devis</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Relancer un devis artisan sans être lourd (WhatsApp, email, J+3)
        </h1>
        <p className="text-lead mt-4 font-light">
          Un devis envoyé sans réponse n&apos;est pas forcément refusé : le client compare,
          reporte, ou oublie. La relance bien faite convertit 15 à 30 % des devis
          &laquo;&nbsp;en attente&nbsp;&raquo; — sans passer pour un harceleur. Voici une
          méthode simple adaptée aux artisans du BTP.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. Quand relancer ?</h2>
        <p className="text-body mt-4 leading-relaxed">
          <strong>J+3</strong> est le bon timing pour un particulier : assez tôt pour rester
          dans sa réflexion, assez tard pour ne pas paraître pressé. Pour un syndic ou une
          copropriété, comptez <strong>J+5 à J+7</strong> (délais internes). Évitez les relances
          le dimanche soir ou avant 8 h : le message se perd dans la notification matinale.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Formulation qui fonctionne</h2>
        <p className="text-body mt-4 leading-relaxed">
          Restez factuel, pas insistant. Exemple WhatsApp :
        </p>
        <blockquote className="text-body mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm italic">
          Bonjour [Prénom], je me permets de revenir sur le devis n°[XXX] envoyé le [date] pour
          [prestation]. Avez-vous pu le consulter ? Je reste disponible pour ajuster le
          chiffrage ou répondre à vos questions. Bonne journée, [Prénom artisan].
        </blockquote>
        <p className="text-body mt-4 leading-relaxed">
          Pas de &laquo;&nbsp;Où en êtes-vous ?&nbsp;&raquo; sec, pas de remise non demandée
          d&apos;emblée. Proposez une disponibilité (&laquo;&nbsp;je peux passer jeudi matin si
          vous avez des questions sur site&nbsp;&raquo;) plutôt qu&apos;une pression commerciale.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Relance J+3 automatique vs manuelle</h2>
        <p className="text-body mt-4 leading-relaxed">
          DevisPropre envoie un email automatique au client 3 jours après l&apos;envoi si le
          devis reste sans réponse, avec rappel du montant et lien vers le document. Vous
          recevez en parallèle un lien WhatsApp pré-rempli pour une relance personnelle en un
          clic. L&apos;automatisation couvre l&apos;oubli ; votre message humain conclut la
          vente.
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Après deux relances : clôturer proprement</h2>
        <p className="text-body mt-4 leading-relaxed">
          Si pas de réponse après J+3 et J+10, envoyez un dernier message :
          &laquo;&nbsp;Je considère le devis comme non retenu ; je reste disponible si votre
          projet reprend.&nbsp;&raquo; Cela libère votre charge mentale et ouvre la porte à un
          retour futur sans rancune. Archivez le devis avec sa date d&apos;envoi — utile en cas
          de litige ou de rappel client six mois plus tard.
        </p>

        <h2 className="heading-section mt-12 text-xl">5. Suivre ses devis en attente</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le problème n&apos;est pas la relance, c&apos;est l&apos;oubli. Tenez une liste des
          devis &laquo;&nbsp;envoyés&nbsp;&raquo; avec date, montant TTC et canal (WhatsApp,
          email). Un tableau de bord qui distingue brouillon, envoyé, accepté et refusé évite
          de relancer deux fois le même client ou d&apos;oublier un gros chantier en attente.
        </p>

        <p className="text-body mt-10 rounded-lg bg-[var(--surface-muted)] px-4 py-4 text-sm">
          <strong>Passer à l&apos;action :</strong>{" "}
          <Link href={ROUTES.inscription} className="link-underline font-medium">
            Essayer DevisPropre (relance J+3 incluse)
          </Link>
          {" · "}
          <Link href={ROUTES.guideDevisWhatsapp} className="link-underline font-medium">
            Guide devis WhatsApp
          </Link>
        </p>

        <GuideRelatedLinks current={ROUTES.blogRelancerDevis} />
      </article>
    </>
  );
}
