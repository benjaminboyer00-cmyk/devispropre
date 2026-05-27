import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conditions générales de vente",
  description: "CGV DevisPropre — conditions de vente des abonnements Starter et Pro.",
  path: "/cgv",
});

export default function CgvPage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-16">
      <h1>Conditions générales de vente</h1>
      <h2>Abonnements et fonctionnalités</h2>
      <ul>
        <li>
          <strong>Gratuit</strong> — 3 devis PDF par mois, mentions légales, verrouillage SHA-256 à
          l&apos;envoi. Sans WhatsApp, facturation ni relances automatiques.
        </li>
        <li>
          <strong>Starter — 19€ HT/mois</strong> — Devis illimités, partage WhatsApp (1 clic),
          relance email client J+3 + lien WhatsApp artisan, factures conformes TVA 2018, attestation
          PDF téléchargeable.
        </li>
        <li>
          <strong>Pro — 39€ HT/mois</strong> — Tout Starter + statistiques avancées (export CSV),
          journal d&apos;audit complet, équipe jusqu&apos;à 5 utilisateurs, support prioritaire sous
          24h ouvrées.
        </li>
      </ul>
      <h2>Paiement</h2>
      <p>Paiement sécurisé via Stripe. Résiliation en 1 clic depuis le tableau de bord.</p>
      <h2>Relances automatiques</h2>
      <p>
        Les relances J+3 envoient un email au client lorsque son adresse est renseignée. Un email
        complémentaire est adressé à l&apos;artisan avec un lien de partage WhatsApp. Elles
        nécessitent la configuration du cron serveur et d&apos;une clé API email (Resend).
      </p>
      <h2>Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation
        ne s&apos;applique pas aux contenus numériques exécutés immédiatement après souscription.
      </p>
    </article>
  );
}
