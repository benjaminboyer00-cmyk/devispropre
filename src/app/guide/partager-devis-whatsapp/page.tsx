import Link from "next/link";
import { GuideRelatedLinks } from "@/components/seo/GuideRelatedLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Partager un devis par WhatsApp — guide artisan",
  description:
    "Envoyer un devis PDF par WhatsApp : message pro, lien de validation client, suivi acceptation. Guide pratique pour artisans BTP avec DevisPropre Starter.",
  path: "/guide/partager-devis-whatsapp",
  keywords: ["devis WhatsApp artisan", "envoyer devis WhatsApp", "devis PDF mobile BTP"],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Guides", path: ROUTES.guideDevisConforme },
  { name: "Devis WhatsApp", path: ROUTES.guideDevisWhatsapp },
];

export default function GuideDevisWhatsappPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />

      <article className="prose-legal mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="heading-hero mt-4 text-3xl sm:text-4xl">
          Partager un devis par WhatsApp : le guide terrain
        </h1>
        <p className="text-lead mt-4 font-light">
          Vos clients répondent sur WhatsApp, pas par e-mail. Un PDF bien présenté + un message
          clair = plus de signatures. Voici comment professionnaliser l&apos;envoi sans perdre
          20 minutes par devis.
        </p>

        <h2 className="heading-section mt-12 text-xl">1. PDF pro avant le message</h2>
        <p className="text-body mt-4 leading-relaxed">
          N&apos;envoyez jamais une photo floue de papier. Générez un PDF avec logo, SIRET,
          détail des postes et totaux TTC. Le client doit pouvoir le transférer à son conjoint
          ou à la banque sans honte.
        </p>

        <h2 className="heading-section mt-12 text-xl">2. Message pré-rempli</h2>
        <p className="text-body mt-4 leading-relaxed">
          Avec DevisPropre Starter, le bouton WhatsApp ouvre une conversation avec un texte
          professionnel : nom du client, montant TTC, lien de consultation en ligne. Vous
          gardez la main pour personnaliser avant d&apos;envoyer.
        </p>

        <h2 className="heading-section mt-12 text-xl">3. Lien de validation en ligne</h2>
        <p className="text-body mt-4 leading-relaxed">
          Le lien public permet au client de consulter le devis sur mobile, de télécharger le PDF
          et de valider en un clic. Vous recevez la notification d&apos;acceptation — fini les
          « j&apos;ai pas vu ton message ».
        </p>

        <h2 className="heading-section mt-12 text-xl">4. Relance sans insister</h2>
        <p className="text-body mt-4 leading-relaxed">
          Relance automatique J+3 incluse en Starter : un rappel discret avant expiration de la
          validité. Vous restez pro sans harceler le client.
        </p>

        <div className="not-prose mt-10 flex flex-wrap gap-3">
          <Link href={ROUTES.inscription} className="ui-btn-primary px-6 py-3">
            Essai Starter — WhatsApp inclus
          </Link>
          <Link href={ROUTES.tarifs} className="ui-btn-outline px-6 py-3">
            Voir les tarifs
          </Link>
        </div>

        <GuideRelatedLinks current={ROUTES.guideDevisWhatsapp} />
      </article>
    </>
  );
}
