"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { claimGuestDraftIfPresent } from "@/lib/claim-guest-draft-client";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing-constants";
import { ROUTES } from "@/lib/routes";
import { registerSchema, formatZodError } from "@/lib/schemas/forms";
import {
  validateFrenchPhone,
  validateFrenchPostcode,
  validateSiret,
} from "@/lib/validation";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    raisonSociale: "",
    siret: "",
    adresse: "",
    codePostal: "",
    ville: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = registerSchema.safeParse({
      ...form,
      phone: form.phone.trim() || undefined,
      password: form.password.trim() || undefined,
    });
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    const extraChecks = [
      parsed.data.phone ? validateFrenchPhone(parsed.data.phone) : null,
      validateSiret(parsed.data.siret),
      validateFrenchPostcode(parsed.data.codePostal),
    ].filter(Boolean);

    if (extraChecks.length > 0) {
      setError(extraChecks[0]!);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...parsed.data }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur inscription");
      return;
    }

    const claim = await claimGuestDraftIfPresent();
    if (claim.error) {
      setError(claim.error);
    }

    const checkoutRes = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "STARTER", trial: true }),
    });
    const checkout = await checkoutRes.json();

    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }

    setLoading(false);
    if (claim.id) {
      router.push(`${ROUTES.dashboardDevis(claim.id)}?needsActivation=1`);
    } else {
      router.push(ROUTES.dashboardActiver);
    }
    router.refresh();
  }

  const inputClass = "ui-input mt-1 text-base";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="ui-alert-error">{error}</p>}

      <p className="text-body rounded-lg bg-[var(--surface-muted)] px-4 py-3 text-sm">
        Pas de mot de passe à retenir — après inscription, connectez-vous par <strong>lien email</strong>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ui-label">Votre prénom et nom</label>
          <input required minLength={2} value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} placeholder="Jean Dupont" />
        </div>
        <div>
          <label className="ui-label">Téléphone (WhatsApp)</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="06 12 34 56 78" inputMode="tel" />
        </div>
      </div>

      <div>
        <label className="ui-label">Email</label>
        <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} placeholder="vous@exemple.fr" inputMode="email" />
      </div>

      <hr className="border-[var(--border)]" />
      <p className="ui-label">Votre entreprise (pour les PDF)</p>

      <div>
        <label className="ui-label">Raison sociale</label>
        <input required minLength={2} value={form.raisonSociale} onChange={(e) => update("raisonSociale", e.target.value)} className={inputClass} placeholder="Dupont Plomberie" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ui-label">SIRET</label>
          <input required value={form.siret} onChange={(e) => update("siret", e.target.value)} className={inputClass} placeholder="14 chiffres" inputMode="numeric" />
        </div>
        <div>
          <label className="ui-label">Code postal</label>
          <input required value={form.codePostal} onChange={(e) => update("codePostal", e.target.value)} className={inputClass} placeholder="75001" inputMode="numeric" />
        </div>
      </div>

      <div>
        <label className="ui-label">Adresse</label>
        <input required minLength={2} value={form.adresse} onChange={(e) => update("adresse", e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="ui-label">Ville</label>
        <input required minLength={2} value={form.ville} onChange={(e) => update("ville", e.target.value)} className={inputClass} />
      </div>

      {showPassword ? (
        <div>
          <label className="ui-label">Mot de passe (optionnel)</label>
          <input type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} className={inputClass} />
        </div>
      ) : (
        <button type="button" onClick={() => setShowPassword(true)} className="text-body text-sm underline-offset-2 hover:underline">
          Ajouter un mot de passe (facultatif)
        </button>
      )}

      <button type="submit" disabled={loading} className="ui-btn-primary w-full py-4 text-base">
        {loading ? "Création…" : "Créer mon compte → essai gratuit 15 jours"}
      </button>

      <p className="text-subtle text-center text-xs">
        Essai Starter {TRIAL_PERIOD_DAYS} jours · Carte requise · Puis 19€/mois sans résiliation ·{" "}
        <Link href="/connexion" className="link-underline font-medium">Déjà inscrit ?</Link>
      </p>
    </form>
  );
}
