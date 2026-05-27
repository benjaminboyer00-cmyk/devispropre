import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conformité loi anti-fraude TVA 2018 — Inaltérabilité garantie",
  description:
    "DevisPropre garantit l'inaltérabilité, la sécurisation, la conservation et l'archivage de vos factures conformément à la loi anti-fraude TVA 2018.",
  path: "/conformite",
  keywords: [
    "loi anti-fraude TVA 2018",
    "facturation inaltérable",
    "logiciel facturation artisan conforme",
    "attestation individuelle TVA",
    ...["devis artisan", "facture artisan"],
  ],
});

export default function ConformitePage() {
  return (
    <article className="page-shell max-w-3xl">
      <h1 className="page-title">Conformité loi anti-fraude TVA 2018</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        DevisPropre est conçu <strong className="text-foreground">secure by design</strong>.
        L&apos;inaltérabilité des données n&apos;est pas une option — c&apos;est le fondement de
        l&apos;architecture.
      </p>

      <section className="mt-10">
        <h2 className="section-title">Les 4 exigences légales</h2>
        <ul className="mt-5 space-y-4 text-foreground/90">
          <li>
            <strong className="text-foreground">Inaltérabilité</strong> — Une facture émise est
            verrouillée définitivement. Aucune modification du contenu n&apos;est possible.
          </li>
          <li>
            <strong className="text-foreground">Sécurisation</strong> — Empreinte SHA-256 à
            l&apos;émission. Chaînage cryptographique entre factures successives.
          </li>
          <li>
            <strong className="text-foreground">Conservation</strong> — Soft delete uniquement.
            Aucune suppression définitive des documents fiscaux.
          </li>
          <li>
            <strong className="text-foreground">Archivage</strong> — Journal d&apos;audit complet
            : qui, quoi, quand, empreinte au moment de l&apos;action.
          </li>
        </ul>
      </section>

      <section className="mt-10 card-padded border-success/30 bg-success-muted">
        <h2 className="section-title text-success">Comment ça marche techniquement</h2>
        <ol className="mt-5 space-y-3 text-foreground/90">
          <li>1. <strong>Brouillon</strong> — Modifiable librement (devis ou facture).</li>
          <li>2. <strong>Verrouillage</strong> — Contenu sérialisé et haché (SHA-256).</li>
          <li>3. <strong>Chaînage</strong> — Empreinte de la facture précédente incluse.</li>
          <li>4. <strong>Attestation</strong> — PDF généré automatiquement à chaque émission.</li>
          <li>5. <strong>Vérification</strong> — Recalcul du hash, détection d&apos;altération.</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="section-title">Journal d&apos;audit</h2>
        <p className="mt-3 text-muted-foreground">
          Chaque action est tracée avec horodatage, adresse IP et empreinte du document au moment
          de l&apos;action.
        </p>
      </section>

      <div className="mt-10">
        <Link href="/inscription" className="btn-primary px-6 py-3">
          Essayer DevisPropre gratuitement
        </Link>
      </div>
    </article>
  );
}
