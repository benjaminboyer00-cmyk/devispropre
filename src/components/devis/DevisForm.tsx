"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateInput } from "@/components/ui/DateInput";
import { useToast } from "@/components/ui/ToastProvider";
import { enqueueDevis, isBrowserOnline } from "@/lib/offline-queue";
import {
  createDevisSchema,
  formatZodError,
  queuedDevisPayloadSchema,
} from "@/lib/schemas/forms";
import type { GuestDevisDraft } from "@/lib/schemas/forms";
import {
  defaultValidUntilInputValue,
  validUntilToIso,
} from "@/lib/devis-defaults";
import { formatEuro } from "@/lib/format";
import {
  formatDraftSavedAt,
  loadGuestDraft,
  saveGuestDraft,
} from "@/lib/guest-devis-draft";
import { ROUTES } from "@/lib/routes";
import { computeDraftTotals, ensureFranchiseNotes, FRANCHISE_MENTION, TVA_RATES } from "@/lib/tva";

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

const NOTES_PLACEHOLDER =
  "Ex : Acompte 30 % à la commande · Solde à réception · Délai d'intervention 2 semaines · Devis valable 30 jours · Bon pour accord";

export function DevisForm({
  clients,
  tvaApplicable = true,
  mode = "authenticated",
}: {
  clients: Client[];
  tvaApplicable?: boolean;
  mode?: "authenticated" | "guest";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [simpleMode, setSimpleMode] = useState(true);
  const [pickExisting, setPickExisting] = useState(clients.length > 0);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const handleValidUntilChange = useCallback((v: string) => setValidUntil(v), []);
  const [notes, setNotes] = useState("");
  const [simpleDesc, setSimpleDesc] = useState("");
  const [simplePriceTtc, setSimplePriceTtc] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([
    { description: "", quantite: 1, prixUnitaireHT: 0, tva: tvaApplicable ? 20 : 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [guestTvaApplicable, setGuestTvaApplicable] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const effectiveTvaApplicable = mode === "guest" ? guestTvaApplicable : tvaApplicable;

  const tvaRate = effectiveTvaApplicable ? 20 : 0;

  const displayLignes: Ligne[] = simpleMode
    ? [
        {
          description: simpleDesc,
          quantite: 1,
          prixUnitaireHT: simplePriceTtc
            ? effectiveTvaApplicable
              ? parseFloat(simplePriceTtc) / (1 + tvaRate / 100)
              : parseFloat(simplePriceTtc)
            : 0,
          tva: tvaRate,
        },
      ]
    : lignes;

  const draftTotals = computeDraftTotals(displayLignes, effectiveTvaApplicable);
  const { totalHT, totalTVA, totalTTC } = draftTotals;

  function handleGuestFranchiseToggle(checked: boolean) {
    setGuestTvaApplicable(checked);
    if (!checked) {
      setLignes((ls) => ls.map((l) => ({ ...l, tva: 0 })));
    }
  }

  function defaultLineTva(): number {
    if (!effectiveTvaApplicable) return 0;
    return lignes[0]?.tva ?? 20;
  }

  function addLigne() {
    setLignes([
      ...lignes,
      { description: "", quantite: 1, prixUnitaireHT: 0, tva: defaultLineTva() },
    ]);
  }

  function updateLigne(i: number, field: keyof Ligne, value: string | number) {
    setLignes((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  function buildDraftPayload(normalizedLignes: Ligne[], clientName: string): GuestDevisDraft {
    return {
      clientNom: clientName,
      clientTelephone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      clientAdresse: clientAdresse.trim() || undefined,
      lignes: normalizedLignes,
      tvaApplicable: effectiveTvaApplicable,
      validUntil: validUntil.trim() || defaultValidUntilInputValue(),
      notes: ensureFranchiseNotes(notes.trim() || undefined, effectiveTvaApplicable),
    };
  }

  const buildAutosaveDraft = useCallback((): GuestDevisDraft | null => {
    const clientName = newClient.trim();
    const hasContent = clientName || simpleDesc.trim() || lignes.some((l) => l.description.trim());
    if (!hasContent) return null;

    const autosaveLignes = simpleMode
      ? displayLignes
      : lignes.filter((l) => l.description.trim() || l.prixUnitaireHT > 0);

    if (autosaveLignes.length === 0) return null;

    return buildDraftPayload(
      autosaveLignes.map((l) => ({
        description: l.description.trim() || "Prestation",
        quantite: Number(l.quantite) || 1,
        prixUnitaireHT: Number(l.prixUnitaireHT) || 0,
        tva: Number(l.tva),
      })),
      clientName || "Client"
    );
  }, [
    newClient,
    simpleDesc,
    lignes,
    simpleMode,
    displayLignes,
    clientPhone,
    clientEmail,
    clientAdresse,
    validUntil,
    notes,
    effectiveTvaApplicable,
  ]);

  useEffect(() => {
    if (mode !== "guest") {
      setHydrated(true);
      return;
    }

    const stored = loadGuestDraft();
    if (stored) {
      setNewClient(stored.clientNom);
      setClientPhone(stored.clientTelephone ?? "");
      setClientEmail(stored.clientEmail ?? "");
      setClientAdresse(stored.clientAdresse ?? "");
      setNotes(stored.notes?.replace(/\nTVA non applicable, art\. 293 B du CGI\.?$/i, "").trim() ?? "");
      setValidUntil(stored.validUntil ?? "");
      setGuestTvaApplicable(stored.tvaApplicable ?? true);
      setLignes(
        stored.lignes.map((l) => ({
          description: l.description,
          quantite: l.quantite,
          prixUnitaireHT: l.prixUnitaireHT,
          tva: l.tva ?? 20,
        }))
      );

      const isDetailed =
        stored.lignes.length > 1 ||
        Boolean(stored.notes) ||
        Boolean(stored.clientAdresse) ||
        Boolean(stored.validUntil);

      if (isDetailed) {
        setSimpleMode(false);
      } else if (stored.lignes[0]) {
        setSimpleDesc(stored.lignes[0].description);
        const tva = stored.tvaApplicable !== false ? (stored.lignes[0].tva ?? 20) : 0;
        const ttc =
          stored.tvaApplicable !== false
            ? stored.lignes[0].quantite * stored.lignes[0].prixUnitaireHT * (1 + tva / 100)
            : stored.lignes[0].quantite * stored.lignes[0].prixUnitaireHT;
        setSimplePriceTtc(ttc > 0 ? ttc.toFixed(2) : "");
      }

      if (stored.savedAt) setLastSavedAt(stored.savedAt);
    }

    setHydrated(true);
  }, [mode]);

  useEffect(() => {
    if (!hydrated || mode !== "guest") return;
    const timer = setTimeout(() => {
      const draft = buildAutosaveDraft();
      if (!draft) return;
      const savedAt = saveGuestDraft(draft);
      setLastSavedAt(savedAt);
    }, 900);
    return () => clearTimeout(timer);
  }, [hydrated, mode, buildAutosaveDraft]);

  async function submitGuestDraft(normalizedLignes: Ligne[], clientName: string) {
    const savedAt = saveGuestDraft(buildDraftPayload(normalizedLignes, clientName));
    setLastSavedAt(savedAt);
    setLoading(false);
    router.push(ROUTES.creerDevisApercu);
  }

  async function submitDevis(normalizedLignes: Ligne[], cid: string | undefined, newClientName?: string) {
    const validUntilIso = validUntilToIso(validUntil.trim() || defaultValidUntilInputValue());
    const notesTrimmed = notes.trim() || undefined;

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
      toast("Devis sauvegardé — synchronisation au retour du réseau.", "info");
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
          email: clientEmail.trim() || undefined,
          adresse: clientAdresse.trim() || undefined,
        }),
      });
      if (!cr.ok) {
        toast("Impossible de créer le client.", "error");
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
      notes: notesTrimmed,
      validUntil: validUntilIso,
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
      const msg = data.error ?? "Erreur";
      toast(msg, "error");
      setError(msg);
      return;
    }

    const devis = await res.json();
    toast("Devis créé avec succès");
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

    if (simpleMode) {
      if (!normalizedLignes[0]?.description || normalizedLignes[0].prixUnitaireHT <= 0) {
        setError("Décrivez la prestation et indiquez un prix.");
        setLoading(false);
        return;
      }
    } else {
      const invalid = normalizedLignes.some(
        (l) => !l.description || l.quantite <= 0 || l.prixUnitaireHT <= 0
      );
      if (invalid) {
        setError("Chaque ligne doit avoir une description, une quantité et un prix unitaire HT.");
        setLoading(false);
        return;
      }
    }

    if (!simpleMode && !validUntil.trim()) {
      setError("Indiquez la date de validité du devis.");
      setLoading(false);
      return;
    }

    if (mode === "guest") {
      const name = clientName || newClient.trim();
      if (!name) {
        setError("Indiquez le nom du client.");
        setLoading(false);
        return;
      }
      await submitGuestDraft(normalizedLignes, name);
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

      {hydrated && mode === "guest" && lastSavedAt && (
        <p className="text-subtle text-xs">
          Brouillon sauvegardé sur cet appareil
          {formatDraftSavedAt(lastSavedAt) ? ` · ${formatDraftSavedAt(lastSavedAt)}` : ""}
        </p>
      )}

      <div>
        <p className="ui-label">Client</p>
        {pickExisting && clients.length > 0 && mode === "authenticated" ? (
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
          <div className="mt-1 space-y-2">
            <input
              placeholder="Nom du client *"
              required={!pickExisting || mode === "guest"}
              autoFocus
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
              className="ui-input text-base"
            />
            {!simpleMode && (
              <>
                <input
                  placeholder="Adresse du chantier (recommandé)"
                  value={clientAdresse}
                  onChange={(e) => setClientAdresse(e.target.value)}
                  className="ui-input text-base"
                />
                <input
                  type="email"
                  placeholder="Email client (optionnel)"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="ui-input text-base"
                  inputMode="email"
                />
              </>
            )}
            <input
              placeholder="Téléphone WhatsApp (optionnel)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="ui-input text-base"
              inputMode="tel"
            />
            {clients.length > 0 && mode === "authenticated" && (
              <button type="button" onClick={() => setPickExisting(true)} className="link-blue text-sm">
                Choisir un client existant
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="ui-label">Prestations</p>
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
            placeholder="Ex : Remplacement chaudière — fourniture et pose"
            required
            value={simpleDesc}
            onChange={(e) => setSimpleDesc(e.target.value)}
            className="ui-input text-base"
          />
          <div>
            <label className="ui-label">Prix {effectiveTvaApplicable ? "TTC" : "HT"} (€)</label>
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
          <div className="text-subtle hidden gap-2 px-1 text-xs font-medium sm:grid sm:grid-cols-5">
            <span className="sm:col-span-2">Description</span>
            <span>Qté</span>
            <span>P.U. HT</span>
            <span>TVA</span>
          </div>
          {lignes.map((l, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-5"
            >
              <input
                placeholder="Description détaillée *"
                required
                value={l.description}
                onChange={(e) => updateLigne(i, "description", e.target.value)}
                className="ui-input sm:col-span-2 !mt-0"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Qté *"
                value={l.quantite}
                onChange={(e) => updateLigne(i, "quantite", parseFloat(e.target.value) || 0)}
                className="ui-input !mt-0"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="P.U. HT € *"
                value={l.prixUnitaireHT || ""}
                onChange={(e) => updateLigne(i, "prixUnitaireHT", parseFloat(e.target.value) || 0)}
                className="ui-input !mt-0"
              />
              {effectiveTvaApplicable ? (
                <select
                  value={l.tva}
                  onChange={(e) => updateLigne(i, "tva", parseFloat(e.target.value))}
                  className="ui-input !mt-0"
                  aria-label="Taux de TVA"
                >
                  {TVA_RATES.map((r) => (
                    <option key={r.value} value={r.value} title={r.legalHint}>
                      TVA {r.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-subtle self-center text-xs" title={FRANCHISE_MENTION}>
                  Franchise TVA
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLigne}
            className="link-blue text-sm"
          >
            + Ajouter une ligne
          </button>
        </div>
      )}

      {!simpleMode && (
        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          {mode === "guest" && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={guestTvaApplicable}
                onChange={(e) => handleGuestFranchiseToggle(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Je facture la TVA (décocher si franchise en base — art. 293 B CGI)
                {!guestTvaApplicable && (
                  <span className="text-subtle mt-1 block text-xs">{FRANCHISE_MENTION}.</span>
                )}
              </span>
            </label>
          )}
          <p className="ui-label">Conditions du devis</p>
          <DateInput
            id="devis-valid-until"
            label="Validité du devis *"
            value={validUntil}
            onChange={handleValidUntilChange}
            defaultValue={defaultValidUntilInputValue()}
            required
            hint="Mention légale — 30 jours est la pratique courante en BTP."
          />
          <div>
            <label className="ui-label text-xs">Conditions & mentions (paiement, délais, acompte)</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={NOTES_PLACEHOLDER}
              className="ui-input mt-1 text-base"
            />
          </div>
        </div>
      )}

      <div className="rounded-lg bg-[var(--surface-muted)] p-4 text-right">
        {effectiveTvaApplicable && !simpleMode && (
          <p className="text-body text-sm">
            HT {formatEuro(totalHT)} · TVA {formatEuro(totalTVA)}
          </p>
        )}
        <p className="heading text-xl">
          {formatEuro(totalTTC)} {effectiveTvaApplicable ? "TTC" : "HT"}
        </p>
      </div>

      {mode === "guest" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="heading text-sm font-semibold">Et la facture ensuite ?</p>
          <p className="text-body mt-2 text-sm">
            Ce devis pourra devenir une <strong>facture conforme TVA 2018</strong> en 1 clic dès
            qu&apos;il est accepté par le client — sans ressaisir les lignes.
          </p>
          <Link
            href={`${ROUTES.inscription}?from=facture`}
            className="link-underline mt-2 inline-block text-sm font-medium"
          >
            Créer un compte pour devis + factures →
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="ui-btn-primary w-full py-4 text-base font-semibold"
      >
        {loading ? "Enregistrement…" : mode === "guest" ? "Voir l'aperçu →" : "Créer le devis →"}
      </button>

      <p className="text-body border-t border-[var(--border)] pt-4 text-center text-sm">
        {mode === "guest" ? (
          <>
            Parcours complet : devis → envoi client →{" "}
            <Link href={ROUTES.guideFacturationAe} className="link-underline font-medium">
              facture en 1 clic
            </Link>
            {" "}après acceptation.
          </>
        ) : (
          <>
            Vous vouliez plutôt faire une facture ?{" "}
            <Link href={ROUTES.dashboardFactures} className="link-underline font-medium">
              Voir mes factures
            </Link>
            {" "}— ou convertissez un devis accepté depuis sa fiche.
          </>
        )}
      </p>
    </form>
  );
}
