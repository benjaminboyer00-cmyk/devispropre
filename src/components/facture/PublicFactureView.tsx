"use client";

import { useEffect, useState } from "react";
import { formatEuro, formatDate } from "@/lib/format";

interface PublicFacture {
  numero: string;
  status: string;
  totalTTC: number;
  integrityOk: boolean;
  lockedAt: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  client: { nom: string };
  company: { raisonSociale: string } | null;
  lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[];
}

export function PublicFactureView({ token }: { token: string }) {
  const [facture, setFacture] = useState<PublicFacture | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/factures/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Facture introuvable");
        return r.json();
      })
      .then((data) => {
        if (data.error) setError(data.error);
        else setFacture(data);
      })
      .catch(() => setError("Impossible de charger la facture. Réessayez plus tard."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-body p-8 text-center">Chargement…</p>;
  if (error || !facture) {
    return (
      <p className="ui-alert-error mx-auto max-w-md p-8 text-center">
        {error || "Facture introuvable"}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="ui-card-padded">
        <p className="link-blue text-sm font-medium">DevisPropre</p>
        <h1 className="heading mt-2 text-2xl">Facture {facture.numero}</h1>
        {facture.company && <p className="text-body">{facture.company.raisonSociale}</p>}
        {facture.issuedAt && (
          <p className="text-body mt-1 text-sm">Émise le {formatDate(facture.issuedAt)}</p>
        )}

        {facture.integrityOk && (
          <p className="ui-alert-success mt-4">✓ Document authentique — aucune altération</p>
        )}

        <table className="mt-6 w-full text-sm">
          <tbody>
            {facture.lignes.map((l, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="heading mt-4 text-right text-xl">{formatEuro(facture.totalTTC)} TTC</p>

        {facture.status === "PAYEE" && (
          <p className="mt-6 text-center font-medium text-green-700 dark:text-green-400">
            ✅ Facture réglée — merci !
          </p>
        )}
      </div>
    </div>
  );
}
