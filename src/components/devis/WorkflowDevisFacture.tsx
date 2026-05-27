import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const STEPS = [
  {
    n: "1",
    title: "Devis sans compte",
    desc: "Client, prestations, TVA — brouillon sauvegardé sur votre appareil.",
  },
  {
    n: "2",
    title: "Compte + essai Starter",
    desc: "Devis conservé automatiquement. PDF pro avec SIRET et mentions légales.",
  },
  {
    n: "3",
    title: "Envoi & partage",
    desc: "Lien client, WhatsApp, SMS ou email — message pré-rempli en 1 clic.",
  },
  {
    n: "4",
    title: "Facture conforme",
    desc: "Devis accepté → facture en 1 clic, hash SHA-256, attestation TVA 2018.",
  },
] as const;

interface WorkflowDevisFactureProps {
  compact?: boolean;
}

/** Parcours devis → facture — visible sur /creer-devis et aperçu invité. */
export function WorkflowDevisFacture({ compact = false }: WorkflowDevisFactureProps) {
  return (
    <section className={compact ? "mt-8" : "mt-12"}>
      <h2 className={compact ? "heading text-lg" : "heading-section text-xl"}>
        Devis et facture — le même flux
      </h2>
      <p className="text-body mt-2 text-sm">
        DevisPropre couvre tout le cycle : devis, envoi client, acceptation et facturation conforme
        à la loi anti-fraude TVA 2018.
      </p>
      <ol className={`mt-6 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <span className="heading flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--blue-soft)] text-sm font-bold text-[var(--blue)]">
              {s.n}
            </span>
            <div>
              <p className="heading font-semibold">{s.title}</p>
              <p className="text-body mt-1 text-sm">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
      {!compact && (
        <p className="text-body mt-6 text-sm">
          En savoir plus :{" "}
          <Link href={ROUTES.guideFacturationAe} className="link-underline font-medium">
            guide facturation auto-entrepreneur
          </Link>
          {" · "}
          <Link href={ROUTES.conformite} className="link-underline font-medium">
            conformité TVA 2018
          </Link>
        </p>
      )}
    </section>
  );
}
