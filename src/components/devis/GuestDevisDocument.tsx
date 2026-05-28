import { draftSummary, lineDisplayTotal } from "@/lib/guest-devis-summary";
import { formatEuro } from "@/lib/format";
import {
  DevisAssuranceDecennale,
  DevisBonPourAccord,
  DevisIssuerHeader,
  DevisLegalFooter,
} from "@/components/devis/DevisLegalBlocks";
import { DevisPaperShell } from "@/components/devis/DevisPaperShell";
import type { GuestDevisDraft } from "@/lib/schemas/forms";

/** Aperçu visuel du devis invité — feuille blanche WYSIWYG. */
export function GuestDevisDocument({ draft }: { draft: GuestDevisDraft }) {
  const summary = draftSummary(draft);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <DevisPaperShell>
      <header className="border-b border-[#14304e] bg-[#1a3a5c] px-6 py-5 text-white sm:px-8">
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

      <article className="p-6 text-gray-900 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <DevisIssuerHeader company={null} guestPlaceholder />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
            <p className="mt-2 font-medium text-gray-900">{summary.clientNom}</p>
            {draft.clientAdresse && <p className="text-sm text-gray-700">{draft.clientAdresse}</p>}
            {draft.clientTelephone && (
              <p className="text-sm text-gray-700">Tél : {draft.clientTelephone}</p>
            )}
            {draft.clientEmail && <p className="text-sm text-gray-700">{draft.clientEmail}</p>}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left text-xs uppercase text-gray-900">
                <th className="pb-2 pr-3">Description</th>
                <th className="pb-2 pr-3 text-right">Qté</th>
                <th className="pb-2 pr-3 text-right">P.U. HT</th>
                {summary.tvaApplicable && <th className="pb-2 pr-3 text-right">TVA</th>}
                <th className="pb-2 text-right">{summary.tvaApplicable ? "Total TTC" : "Total HT"}</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {draft.lignes.map((l, i) => (
                <tr key={i} className="border-b border-gray-100">
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

        <div className="mt-6 space-y-6">
          <div className="border-t border-gray-200 pt-4">
            {summary.tvaApplicable && (
              <div className="mb-2 space-y-1 text-right text-sm text-gray-700">
                <p>Total HT : {formatEuro(summary.totalHT)}</p>
                <p>TVA : {formatEuro(summary.totalTVA)}</p>
              </div>
            )}
            <p className="text-right text-lg font-bold text-gray-900">
              Total {summary.tvaApplicable ? "TTC" : "HT"} : {formatEuro(summary.totalTTC)}
            </p>
          </div>

          {draft.notes && (
            <p className="border-t border-gray-200 pt-4 text-sm text-gray-700">
              <span className="font-medium text-gray-900">Conditions particulières : </span>
              {draft.notes}
            </p>
          )}

          <DevisAssuranceDecennale company={null} />
          <DevisBonPourAccord />
          <DevisLegalFooter company={null} franchiseTva={!summary.tvaApplicable} />
        </div>
      </article>
    </DevisPaperShell>
  );
}
