"use client";

import { useEffect, useRef, useState } from "react";
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
  const idempotencyRef = useRef<string | null>(null);

  function nextIdempotencyKey(): string {
    const key = crypto.randomUUID();
    idempotencyRef.current = key;
    return key;
  }

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
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyRef.current ?? nextIdempotencyKey(),
        },
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

  if (loading) return <p className="text-body p-8 text-center">Chargement…</p>;
  if (error || !devis) {
    return <p className="ui-alert-error mx-auto max-w-md p-8 text-center">{error || "Devis introuvable"}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="ui-card-padded">
        <p className="link-blue text-sm font-medium">DevisPropre</p>
        <h1 className="heading mt-2 text-2xl">Devis {devis.numero}</h1>
        {devis.company && <p className="text-body">{devis.company.raisonSociale}</p>}

        {devis.integrityOk && (
          <p className="ui-alert-success mt-4">✓ Document authentique — aucune altération</p>
        )}

        <table className="mt-6 w-full text-sm">
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="heading mt-4 text-right text-xl">{formatEuro(devis.totalTTC)} TTC</p>

        {devis.status === "ENVOYE" && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => respond("ACCEPTE")}
              disabled={actionLoading}
              className="ui-btn-primary flex-1 py-3 dark:bg-green-600 dark:hover:bg-green-500"
            >
              J&apos;accepte
            </button>
            <button
              onClick={() => respond("REFUSE")}
              disabled={actionLoading}
              className="ui-btn-outline flex-1 border-red-600 py-3 text-red-700 dark:border-red-400 dark:text-red-300"
            >
              Je refuse
            </button>
          </div>
        )}

        {devis.status === "ACCEPTE" && (
          <p className="mt-6 text-center font-medium text-green-700 dark:text-green-400">
            ✅ Devis accepté — merci !
          </p>
        )}
      </div>
    </div>
  );
}
