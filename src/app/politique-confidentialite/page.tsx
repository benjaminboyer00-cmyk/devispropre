import { LEGAL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Politique de confidentialité",
  description: "Politique de confidentialité DevisPropre — traitement des données personnelles (RGPD).",
  path: "/politique-confidentialite",
});

export default function PolitiqueConfidentialitePage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-16">
      <h1>Politique de confidentialité</h1>
      <p>
        DevisPropre ({LEGAL.editor.name}) collecte les données nécessaires à la facturation :
        identité professionnelle (SIRET, adresse), coordonnées clients et documents commerciaux.
      </p>
      <h2>Finalités</h2>
      <ul>
        <li>Création et envoi de devis et factures</li>
        <li>Conformité fiscale (loi anti-fraude TVA 2018)</li>
        <li>Support client</li>
      </ul>
      <h2>Conservation</h2>
      <p>
        Les documents fiscaux sont conservés conformément aux obligations légales (10 ans).
        Soft delete uniquement — aucune suppression définitive des factures émises.
      </p>
      <h2>Vos droits</h2>
      <p>
        Contact : {LEGAL.editor.email} — droit d&apos;accès, rectification, opposition (RGPD).
      </p>
      <h2>Mesure d&apos;audience</h2>
      <p>
        Le site marketing utilise Plausible Analytics (statistiques anonymisées, sans cookies
        publicitaires), PostHog (analyse UX et replays de session — champs masqués) et Vercel
        Speed Insights (performance Core Web Vitals). Ces outils ne sont actifs qu&apos;en
        production lorsque configurés. Vous pouvez vous opposer via les paramètres de votre
        navigateur ou nous contacter.
      </p>
    </article>
  );
}
