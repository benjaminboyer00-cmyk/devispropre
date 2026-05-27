import { draftSummary, lineDisplayTotal } from "@/lib/claim-guest-draft-client";
import { formatEuro } from "@/lib/format";
import { FRANCHISE_MENTION } from "@/lib/tva";
import type { GuestDevisDraft } from "@/lib/schemas/forms";

/** Aperçu visuel du devis invité — rendu type document PDF. */
export function GuestDevisDocument({ draft }: { draft: GuestDevisDraft }) {
  const summary = draftSummary(draft);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <header className="border-b border-[var(--border)] bg-[var(--blue)] px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-90">DevisPropre</p>
            <h2 className="mt-1 text-xl font-bold">DEVIS</h2>
          </div>
          <div className="text-right text-sm opacity-90">
            <p>Date : {today}</p>
            {summary.validUntil && (
              <p className="mt-1">
                Valable jusqu&apos;au{" "}
                {new Date(`${summary.validUntil}T12:00:00`).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-5 sm:grid-cols-2">
        <div>
          <p className="text-subtle text-xs font-semibold uppercase tracking-wide">Émetteur</p>
          <p className="text-body mt-2 text-sm">Votre entreprise (renseignée à l&apos;inscription)</p>
        </div>
        <div>
          <p className="text-subtle text-xs font-semibold uppercase tracking-wide">Client</p>
          <p className="heading mt-2 font-medium">{summary.clientNom}</p>
          {draft.clientAdresse && <p className="text-body text-sm">{draft.clientAdresse}</p>}
          {draft.clientTelephone && <p className="text-body text-sm">Tél : {draft.clientTelephone}</p>}
          {draft.clientEmail && <p className="text-body text-sm">{draft.clientEmail}</p>}
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-4">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
              <th className="pb-2 pr-3">Description</th>
              <th className="pb-2 pr-3 text-right">Qté</th>
              <th className="pb-2 pr-3 text-right">P.U. HT</th>
              {summary.tvaApplicable && <th className="pb-2 pr-3 text-right">TVA</th>}
              <th className="pb-2 text-right">
                {summary.tvaApplicable ? "Total TTC" : "Total HT"}
              </th>
            </tr>
          </thead>
          <tbody>
            {draft.lignes.map((l, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                <td className="py-3 pr-3">{l.description}</td>
                <td className="py-3 pr-3 text-right">{l.quantite}</td>
                <td className="py-3 pr-3 text-right">{formatEuro(l.prixUnitaireHT)}</td>
                {summary.tvaApplicable && (
                  <td className="py-3 pr-3 text-right">{l.tva ?? 20} %</td>
                )}
                <td className="py-3 text-right font-medium">
                  {formatEuro(lineDisplayTotal(l, summary.tvaApplicable))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-6 py-4">
        {summary.tvaApplicable && (
          <div className="text-body mb-2 space-y-1 text-right text-sm">
            <p>Total HT : {formatEuro(summary.totalHT)}</p>
            <p>TVA : {formatEuro(summary.totalTVA)}</p>
          </div>
        )}
        <p className="heading text-right text-lg font-bold">
          Total {summary.tvaApplicable ? "TTC" : "HT"} : {formatEuro(summary.totalTTC)}
        </p>
        {!summary.tvaApplicable && (
          <p className="text-subtle mt-2 text-right text-xs">{FRANCHISE_MENTION}.</p>
        )}
        {draft.notes && (
          <p className="text-body mt-4 border-t border-[var(--border)] pt-4 text-sm">
            <span className="font-medium">Conditions : </span>
            {draft.notes}
          </p>
        )}
      </footer>
    </article>
  );
}
