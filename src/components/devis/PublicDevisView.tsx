"use client";

import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/format";

interface PublicDevis {
  numero: string;
  status: string;
  totalTTC: number;
  integrityOk: boolean;
  lockedAt: string | null;
  client: { nom: string };
  company: { raisonSociale: string } | null;
  lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[];
}

export function PublicDevisView({ token }: { token: string }) {
  const [devis, setDevis] = useState<PublicDevis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/public/devis/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Devis introuvable");
        return r.json();
      })
      .then((data) => {
        if (data.error) setError(data.error);
        else setDevis(data);
      })
      .catch(() => setError("Impossible de charger le devis. Réessayez plus tard."))
      .finally(() => setLoading(false));
  }, [token]);

  async function respond(status: "ACCEPTE" | "REFUSE") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/public/devis/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur");
        return;
      }
      setDevis((d) => (d ? { ...d, status } : d));
    } catch {
      setError("Erreur réseau — réessayez.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p className="p-8 text-center">Chargement…</p>;
  if (error || !devis) return <p className="p-8 text-center text-red-600">{error || "Devis introuvable"}</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-blue-600 font-medium">DevisPropre</p>
        <h1 className="mt-2 text-2xl font-bold">Devis {devis.numero}</h1>
        {devis.company && <p className="text-slate-600">{devis.company.raisonSociale}</p>}

        {devis.integrityOk && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            ✓ Document authentique — aucune altération
          </p>
        )}

        <table className="mt-6 w-full text-sm">
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-right text-xl font-bold">{formatEuro(devis.totalTTC)} TTC</p>

        {devis.status === "ENVOYE" && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => respond("ACCEPTE")}
              disabled={actionLoading}
              className="flex-1 rounded-lg bg-green-600 py-3 font-medium text-white"
            >
              J&apos;accepte
            </button>
            <button
              onClick={() => respond("REFUSE")}
              disabled={actionLoading}
              className="flex-1 rounded-lg border border-red-600 py-3 text-red-700"
            >
              Je refuse
            </button>
          </div>
        )}

        {devis.status === "ACCEPTE" && (
          <p className="mt-6 text-center text-green-700 font-medium">✅ Devis accepté — merci !</p>
        )}
      </div>
    </div>
  );
}
