"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDevisSchema, formatZodError } from "@/lib/schemas/forms";

interface Client {
  id: string;
  nom: string;
}

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaireHT: number;
  tva: number;
}

const TVA_OPTIONS = [0, 5.5, 10, 20];

export function DevisForm({ clients, tvaApplicable = true }: { clients: Client[]; tvaApplicable?: boolean }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([
    { description: "", quantite: 1, prixUnitaireHT: 0, tva: tvaApplicable ? 20 : 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalHT = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHT, 0);
  const totalTVA = tvaApplicable
    ? lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHT * (l.tva / 100), 0)
    : 0;
  const totalTTC = totalHT + totalTVA;

  function updateLigne(i: number, field: keyof Ligne, value: string | number) {
    setLignes((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!newClient.trim() && !clientId) {
      setError("Sélectionnez un client ou saisissez un nouveau nom.");
      setLoading(false);
      return;
    }

    let cid = clientId;
    if (newClient.trim()) {
      const cr = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newClient.trim() }),
      });
      if (!cr.ok) {
        setError("Erreur création client");
        setLoading(false);
        return;
      }
      const client = await cr.json();
      cid = client.id;
    }

    const normalizedLignes = lignes.map((l) => ({
      description: l.description.trim(),
      quantite: Number(l.quantite),
      prixUnitaireHT: Number(l.prixUnitaireHT),
      tva: Number(l.tva),
    }));

    const devisPayload = createDevisSchema.safeParse({ clientId: cid, lignes: normalizedLignes });
    if (!devisPayload.success) {
      setError(formatZodError(devisPayload.error));
      setLoading(false);
      return;
    }

    const res = await fetch("/api/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(devisPayload.data),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur");
      return;
    }

    const devis = await res.json();
    router.push(`/dashboard/devis/${devis.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="ui-alert-error">{error}</p>}

      <div>
        <label className="ui-label">Client</label>
        {clients.length === 0 && !newClient && (
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Aucun client — saisissez un nom ci-dessous.</p>
        )}
        {clients.length > 0 && (
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="ui-input mt-1">
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        )}
        <input
          placeholder="Ou nouveau client (nom)"
          value={newClient}
          onChange={(e) => setNewClient(e.target.value)}
          className="ui-input mt-2"
        />
      </div>

      <div className="space-y-3">
        <p className="ui-label">Prestations</p>
        {lignes.map((l, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-5">
            <input
              placeholder="Description"
              required
              value={l.description}
              onChange={(e) => updateLigne(i, "description", e.target.value)}
              className="ui-input sm:col-span-2 !mt-0"
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Qté"
              value={l.quantite}
              onChange={(e) => updateLigne(i, "quantite", parseFloat(e.target.value))}
              className="ui-input !mt-0"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="P.U. HT €"
              value={l.prixUnitaireHT || ""}
              onChange={(e) => updateLigne(i, "prixUnitaireHT", parseFloat(e.target.value) || 0)}
              className="ui-input !mt-0"
            />
            {tvaApplicable ? (
              <select
                value={l.tva}
                onChange={(e) => updateLigne(i, "tva", parseFloat(e.target.value))}
                className="ui-input !mt-0"
              >
                {TVA_OPTIONS.filter((t) => t > 0).map((t) => (
                  <option key={t} value={t}>TVA {t}%</option>
                ))}
              </select>
            ) : (
              <span className="text-subtle self-center text-xs">Franchise TVA</span>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setLignes([...lignes, { description: "", quantite: 1, prixUnitaireHT: 0, tva: tvaApplicable ? 20 : 0 }])} className="link-blue text-sm">
          + Ajouter une ligne
        </button>
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-right dark:bg-slate-800/80">
        <p className="text-body text-sm">Total HT : {totalHT.toFixed(2)} €</p>
        {tvaApplicable ? (
          <p className="text-body text-sm">TVA : {totalTVA.toFixed(2)} €</p>
        ) : (
          <p className="text-subtle text-xs">TVA non applicable, art. 293 B du CGI</p>
        )}
        <p className="heading text-lg">Total TTC : {totalTTC.toFixed(2)} €</p>
      </div>

      <button type="submit" disabled={loading} className="ui-btn-primary w-full py-3">
        {loading ? "Création…" : "Créer le devis"}
      </button>
    </form>
  );
}
