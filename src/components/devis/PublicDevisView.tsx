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

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-danger">
        {error || "Devis introuvable"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card-padded">
        <p className="text-sm font-semibold text-primary">DevisPropre</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Devis {devis.numero}
        </h1>
        {devis.company && (
          <p className="mt-1 text-muted-foreground">{devis.company.raisonSociale}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">Pour {devis.client.nom}</p>

        {devis.integrityOk && (
          <p className="mt-4 rounded-xl bg-success-muted px-4 py-2.5 text-sm text-success">
            ✓ Document authentique — aucune altération
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">Prestation</th>
                <th className="p-3 text-right">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {devis.lignes.map((l, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">{l.description}</td>
                  <td className="p-3 text-right text-foreground">{formatEuro(l.totalHT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-right text-xl font-bold text-foreground">
          {formatEuro(devis.totalTTC)} TTC
        </p>

        {devis.status === "ENVOYE" && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => respond("ACCEPTE")}
              disabled={actionLoading}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              J&apos;accepte
            </button>
            <button
              onClick={() => respond("REFUSE")}
              disabled={actionLoading}
              className="btn-danger flex-1 py-3 disabled:opacity-50"
            >
              Je refuse
            </button>
          </div>
        )}

        {devis.status === "ACCEPTE" && (
          <p className="mt-6 text-center font-medium text-success">
            ✅ Devis accepté — merci !
          </p>
        )}
      </div>
    </div>
  );
}
