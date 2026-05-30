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
        Le site marketing utilise Google Tag Manager et Google Analytics 4 (mesure d&apos;audience
        avec cookies analytiques — vous pouvez refuser via les paramètres de votre navigateur ou
        l&apos;extension de désactivation Google). Plausible Analytics (statistiques anonymisées) et
        PostHog (analyse UX) peuvent compléter ces outils lorsqu&apos;ils sont configurés. Ces
        services ne sont actifs qu&apos;en production. Contact : {LEGAL.editor.email} pour exercer
        vos droits.
      </p>
    </article>
  );
}
