import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conditions générales de vente",
  description: "CGV DevisPropre — conditions de vente des abonnements Starter et Pro.",
  path: "/cgv",
});

export default function CgvPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-slate">
      <h1>Conditions générales de vente</h1>
      <h2>Abonnements</h2>
      <ul>
        <li>Gratuit : 3 devis par mois</li>
        <li>Starter : 19€ HT/mois — devis illimités</li>
        <li>Pro : 39€ HT/mois — équipe et statistiques</li>
      </ul>
      <h2>Paiement</h2>
      <p>Paiement sécurisé via Stripe. Résiliation en 1 clic depuis le tableau de bord.</p>
      <h2>Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation
        ne s&apos;applique pas aux contenus numériques exécutés immédiatement après souscription.
      </p>
    </article>
  );
}
