"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  nom: string;
}

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaireHT: number;
}

export function DevisForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([
    { description: "", quantite: 1, prixUnitaireHT: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalHT = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHT, 0);
  const totalTTC = totalHT * 1.2;

  function updateLigne(i: number, field: keyof Ligne, value: string | number) {
    setLignes((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

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

    const res = await fetch("/api/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: cid, lignes }),
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
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="block text-sm font-medium">Client</label>
        {clients.length > 0 && (
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        )}
        <input
          placeholder="Ou nouveau client (nom)"
          value={newClient}
          onChange={(e) => setNewClient(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Prestations</p>
        {lignes.map((l, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-4">
            <input
              placeholder="Description"
              required
              value={l.description}
              onChange={(e) => updateLigne(i, "description", e.target.value)}
              className="sm:col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Qté"
              value={l.quantite}
              onChange={(e) => updateLigne(i, "quantite", parseFloat(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="P.U. HT €"
              value={l.prixUnitaireHT || ""}
              onChange={(e) => updateLigne(i, "prixUnitaireHT", parseFloat(e.target.value) || 0)}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLignes([...lignes, { description: "", quantite: 1, prixUnitaireHT: 0 }])}
          className="text-sm text-blue-600 hover:underline"
        >
          + Ajouter une ligne
        </button>
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-right">
        <p className="text-sm text-slate-600">Total HT : {totalHT.toFixed(2)} €</p>
        <p className="text-lg font-bold">Total TTC : {totalTTC.toFixed(2)} €</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Création…" : "Créer le devis"}
      </button>
    </form>
  );
}
