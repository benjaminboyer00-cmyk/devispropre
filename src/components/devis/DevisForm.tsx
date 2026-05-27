"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enqueueDevis, isBrowserOnline } from "@/lib/offline-queue";
import {
  createDevisSchema,
  formatZodError,
  queuedDevisPayloadSchema,
} from "@/lib/schemas/forms";
import { formatEuro } from "@/lib/format";

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
  const [simpleMode, setSimpleMode] = useState(true);
  const [pickExisting, setPickExisting] = useState(clients.length > 0);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [simpleDesc, setSimpleDesc] = useState("");
  const [simplePriceTtc, setSimplePriceTtc] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([
    { description: "", quantite: 1, prixUnitaireHT: 0, tva: tvaApplicable ? 20 : 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const tvaRate = tvaApplicable ? 20 : 0;

  const displayLignes: Ligne[] = simpleMode
    ? [
        {
          description: simpleDesc,
          quantite: 1,
          prixUnitaireHT: simplePriceTtc
            ? tvaApplicable
              ? parseFloat(simplePriceTtc) / (1 + tvaRate / 100)
              : parseFloat(simplePriceTtc)
            : 0,
          tva: tvaRate,
        },
      ]
    : lignes;

  const totalHT = displayLignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHT, 0);
  const totalTVA = tvaApplicable
    ? displayLignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHT * (l.tva / 100), 0)
    : 0;
  const totalTTC = totalHT + totalTVA;

  function updateLigne(i: number, field: keyof Ligne, value: string | number) {
    setLignes((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  async function submitDevis(normalizedLignes: Ligne[], cid: string | undefined, newClientName?: string) {
    if (!isBrowserOnline()) {
      const offlinePayload = queuedDevisPayloadSchema.safeParse({
        clientId: newClientName ? undefined : cid,
        newClient: newClientName || undefined,
        lignes: normalizedLignes,
      });
      if (!offlinePayload.success) {
        setError(formatZodError(offlinePayload.error));
        setLoading(false);
        return;
      }
      enqueueDevis(offlinePayload.data);
      setInfo("Devis sauvegardé — sync automatique au retour du réseau.");
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    let clientIdFinal = cid;
    if (newClientName) {
      const cr = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: newClientName,
          telephone: clientPhone.trim() || undefined,
        }),
      });
      if (!cr.ok) {
        setError("Impossible de créer le client.");
        setLoading(false);
        return;
      }
      const client = await cr.json();
      clientIdFinal = client.id;
    }

    const devisPayload = createDevisSchema.safeParse({
      clientId: clientIdFinal,
      lignes: normalizedLignes,
    });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    const clientName = newClient.trim();
    if (!clientName && !clientId) {
      setError("Indiquez le nom du client.");
      setLoading(false);
      return;
    }

    const normalizedLignes = displayLignes.map((l) => ({
      description: l.description.trim(),
      quantite: Number(l.quantite),
      prixUnitaireHT: Number(l.prixUnitaireHT),
      tva: Number(l.tva),
    }));

    if (simpleMode && (!normalizedLignes[0]?.description || normalizedLignes[0].prixUnitaireHT <= 0)) {
      setError("Décrivez la prestation et indiquez un prix.");
      setLoading(false);
      return;
    }

    await submitDevis(
      normalizedLignes,
      pickExisting && !clientName ? clientId : undefined,
      clientName || undefined
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="ui-alert-error">{error}</p>}
      {info && <p className="ui-alert-success">{info}</p>}

      <div>
        <label className="ui-label">Client</label>
        {pickExisting && clients.length > 0 ? (
          <>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="ui-input mt-1 text-base">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <button type="button" onClick={() => setPickExisting(false)} className="link-blue mt-2 text-sm">
              + Nouveau client
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Nom du client"
              required={!pickExisting}
              autoFocus
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
              className="ui-input mt-1 text-base"
            />
            <input
              placeholder="Téléphone WhatsApp (optionnel)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="ui-input mt-2 text-base"
              inputMode="tel"
            />
            {clients.length > 0 && (
              <button type="button" onClick={() => setPickExisting(true)} className="link-blue mt-2 text-sm">
                Choisir un client existant
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="ui-label">Prestation</p>
        <button
          type="button"
          onClick={() => setSimpleMode(!simpleMode)}
          className="text-body text-xs underline-offset-2 hover:underline"
        >
          {simpleMode ? "Mode détaillé" : "Mode simple"}
        </button>
      </div>

      {simpleMode ? (
        <div className="space-y-3">
          <input
            placeholder="Ex : Remplacement chaudière"
            required
            value={simpleDesc}
            onChange={(e) => setSimpleDesc(e.target.value)}
            className="ui-input text-base"
          />
          <div>
            <label className="ui-label">Prix {tvaApplicable ? "TTC" : "HT"} (€)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="1500"
              value={simplePriceTtc}
              onChange={(e) => setSimplePriceTtc(e.target.value)}
              className="ui-input mt-1 text-base"
              inputMode="decimal"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
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
          <button
            type="button"
            onClick={() =>
              setLignes([...lignes, { description: "", quantite: 1, prixUnitaireHT: 0, tva: tvaApplicable ? 20 : 0 }])
            }
            className="link-blue text-sm"
          >
            + Ligne
          </button>
        </div>
      )}

      <div className="rounded-lg bg-[var(--surface-muted)] p-4 text-right">
        <p className="heading text-xl">{formatEuro(totalTTC)} {tvaApplicable ? "TTC" : "HT"}</p>
      </div>

      <button type="submit" disabled={loading} className="ui-btn-primary w-full py-4 text-base font-semibold">
        {loading ? "Création…" : "Créer le devis →"}
      </button>
    </form>
  );
}
