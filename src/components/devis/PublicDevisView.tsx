"use client";

import { useEffect, useRef, useState } from "react";
import { DevisClientAcceptPanel } from "@/components/devis/DevisClientAcceptPanel";
import { PublicDevisDocument, type PublicDevisData } from "@/components/devis/PublicDevisDocument";

export function PublicDevisView({ token }: { token: string }) {
  const [devis, setDevis] = useState<PublicDevisData | null>(null);
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

  async function respond(
    status: "ACCEPTE" | "REFUSE",
    extra?: { acceptanceText?: string; signatureData?: string }
  ) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/devis/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyRef.current ?? nextIdempotencyKey(),
        },
        body: JSON.stringify({ status, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setDevis((d) =>
        d
          ? {
              ...d,
              status,
              acceptedAt: status === "ACCEPTE" ? new Date().toISOString() : d.acceptedAt,
              clientAcceptanceText: extra?.acceptanceText ?? d.clientAcceptanceText,
              clientSignatureData: extra?.signatureData ?? d.clientSignatureData,
            }
          : d
      );
    } catch {
      setError("Erreur réseau — réessayez.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p className="text-body p-8 text-center">Chargement…</p>;
  if (error && !devis) {
    return <p className="ui-alert-error mx-auto max-w-md p-8 text-center">{error}</p>;
  }
  if (!devis) {
    return <p className="ui-alert-error mx-auto max-w-md p-8 text-center">Devis introuvable</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {devis.integrityOk && (
        <p className="ui-alert-success mb-6 text-center text-sm">
          ✓ Document authentique — aucune altération détectée
        </p>
      )}

      {error && <p className="ui-alert-error mb-4 text-sm">{error}</p>}

      <PublicDevisDocument devis={devis}>
        {devis.status === "ENVOYE" && devis.canAccept !== false && (
          <DevisClientAcceptPanel
            loading={actionLoading}
            onAccept={({ acceptanceText, signatureData }) =>
              respond("ACCEPTE", { acceptanceText, signatureData })
            }
            onRefuse={() => respond("REFUSE")}
          />
        )}

        {devis.status === "ENVOYE" && devis.linkExpired && (
          <p className="ui-alert-warning mt-6 text-center text-sm">
            Ce lien de signature a expiré. Contactez votre artisan pour recevoir un nouveau devis.
          </p>
        )}

        {devis.status === "ACCEPTE" && (
          <p className="mt-6 text-center font-medium text-green-700 dark:text-green-400">
            ✅ Devis accepté et signé — merci !
          </p>
        )}

        {devis.status === "REFUSE" && (
          <p className="mt-6 text-center font-medium text-red-700 dark:text-red-400">
            Devis refusé.
          </p>
        )}
      </PublicDevisDocument>
    </div>
  );
}
