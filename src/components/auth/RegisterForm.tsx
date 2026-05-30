"use client";

import { useCallback, useRef, useState } from "react";
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
import { useToast } from "@/components/ui/ToastProvider";
import {
  TurnstileWidget,
  isTurnstileConfigured,
  type TurnstileWidgetHandle,
} from "@/components/auth/TurnstileWidget";

interface RegisterFormProps {
  turnstileSiteKey?: string;
}

export function RegisterForm({ turnstileSiteKey }: RegisterFormProps) {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
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
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileError, setTurnstileError] = useState("");
  const { toast } = useToast();

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileReady(token.length > 0);
    setTurnstileError("");
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
    setTurnstileReady(false);
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setTurnstileError(message);
    setTurnstileReady(false);
  }, []);

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
      const msg = formatZodError(parsed.error);
      toast(msg, "error");
      setError(msg);
      return;
    }

    const extraChecks = [
      parsed.data.phone ? validateFrenchPhone(parsed.data.phone) : null,
      validateSiret(parsed.data.siret),
      validateFrenchPostcode(parsed.data.codePostal),
    ].filter(Boolean);

    if (extraChecks.length > 0) {
      toast(extraChecks[0]!, "error");
      setError(extraChecks[0]!);
      return;
    }

    if (isTurnstileConfigured(turnstileSiteKey) && !turnstileToken) {
      const msg = turnstileError
        ? turnstileError
        : turnstileReady
          ? "Veuillez compléter la vérification anti-robot."
          : "Chargement de la vérification anti-robot… Réessayez dans quelques secondes.";
      toast(msg, "error");
      setError(msg);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        ...parsed.data,
        turnstileToken: turnstileToken || undefined,
      }),
    });

    const data = await res.json().catch(() => ({} as { error?: string }));
    setLoading(false);

    if (!res.ok) {
      const msg = data.error ?? "Erreur inscription";
      toast(msg, "error");
      setError(msg);
      turnstileRef.current?.reset();
      return;
    }

    if ((data as { needsEmailVerification?: boolean }).needsEmailVerification) {
      toast("Vérifiez votre boîte mail pour activer votre compte.");
      router.push(`${ROUTES.connexion}?verify=1`);
      return;
    }

    toast("Compte créé — finalisation en cours…");

    const claim = await claimGuestDraftIfPresent();
    if (claim.error) {
      toast(claim.error, "error");
      setError(claim.error);
    }

    const checkoutRes = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "STARTER", trial: true }),
    });
    const checkout = await checkoutRes.json().catch(() => ({} as { url?: string }));

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

      <TurnstileWidget
        ref={turnstileRef}
        siteKey={turnstileSiteKey}
        onToken={handleTurnstileToken}
        onExpire={handleTurnstileExpire}
        onError={handleTurnstileError}
        className="flex justify-center"
      />
      {turnstileError && <p className="text-body text-center text-sm text-red-600">{turnstileError}</p>}

      <button type="submit" disabled={loading} aria-busy={loading} className="ui-btn-primary w-full py-4 text-base">
        {loading ? "Création…" : "Créer mon compte → essai gratuit 15 jours"}
      </button>

      <p className="text-subtle text-center text-xs">
        Essai Starter {TRIAL_PERIOD_DAYS} jours · Puis 19€/mois sans résiliation ·{" "}
        <Link href="/connexion" className="link-underline font-medium">Déjà inscrit ?</Link>
      </p>
    </form>
  );
}
