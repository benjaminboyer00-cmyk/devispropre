"use client";

import { useEffect, useState } from "react";
import {
  PublicFactureDocument,
  type PublicFactureData,
} from "@/components/facture/PublicFactureDocument";

export function PublicFactureView({ token }: { token: string }) {
  const [facture, setFacture] = useState<PublicFactureData | null>(null);
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {facture.integrityOk && (
        <p className="ui-alert-success mb-6 text-center text-sm">
          ✓ Document authentique — aucune altération détectée
        </p>
      )}

      <PublicFactureDocument facture={facture}>
        {facture.status === "PAYEE" && (
          <p className="text-center font-medium text-green-700 dark:text-green-400">
            ✅ Facture réglée — merci !
          </p>
        )}
      </PublicFactureDocument>
    </div>
  );
}
