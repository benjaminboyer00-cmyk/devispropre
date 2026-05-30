"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { claimGuestDraftIfPresent } from "@/lib/claim-guest-draft-client";
import { ROUTES } from "@/lib/routes";
import { loginSchema, magicLinkSchema, formatZodError } from "@/lib/schemas/forms";
import { useToast } from "@/components/ui/ToastProvider";
import {
  TurnstileWidget,
  isTurnstileConfigured,
  type TurnstileWidgetHandle,
} from "@/components/auth/TurnstileWidget";

interface LoginFormProps {
  turnstileSiteKey?: string;
}

export function LoginForm({ turnstileSiteKey }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const { toast } = useToast();

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError("");
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setTurnstileError(message);
  }, []);

  const linkError =
    urlError === "lien_expire"
      ? "Ce lien a expiré. Demandez-en un nouveau ci-dessous."
      : urlError === "lien_invalide"
        ? "Lien invalide. Entrez votre email pour en recevoir un nouveau."
        : "";

  const verifyHint = searchParams.get("verify") === "1";
  const fromDevis = searchParams.get("from") === "devis";

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const msg = formatZodError(parsed.error);
      toast(msg, "error");
      setError(msg);
      return;
    }

    if (isTurnstileConfigured(turnstileSiteKey) && !turnstileToken) {
      const msg = turnstileError || "Veuillez compléter la vérification anti-robot.";
      toast(msg, "error");
      setError(msg);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        ...parsed.data,
        turnstileToken: turnstileToken || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msg = data.error ?? "Erreur de connexion";
      toast(msg, "error");
      setError(msg);
      turnstileRef.current?.reset();
      return;
    }

    toast("Connexion réussie");

    const claim = await claimGuestDraftIfPresent();
    if (claim.error) {
      toast(claim.error, "error");
      setError(claim.error);
      if (claim.id) {
        router.push(`${ROUTES.dashboardDevis(claim.id)}?claimed=1`);
        router.refresh();
      }
      return;
    }
    router.push(claim.id ? `${ROUTES.dashboardDevis(claim.id)}?claimed=1` : ROUTES.dashboard);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const parsed = magicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      const msg = formatZodError(parsed.error);
      toast(msg, "error");
      setError(msg);
      return;
    }

    if (isTurnstileConfigured(turnstileSiteKey) && !turnstileToken) {
      const msg = turnstileError || "Veuillez compléter la vérification anti-robot.";
      toast(msg, "error");
      setError(msg);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, turnstileToken: turnstileToken || undefined }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msg = data.error ?? "Erreur";
      toast(msg, "error");
      setError(msg);
      turnstileRef.current?.reset();
      return;
    }

    setInfo(
      "Si un compte existe avec cet email, un lien de connexion vient d'être envoyé. Vérifiez votre boîte mail (et les spams)."
    );
    toast("Lien de connexion envoyé — vérifiez votre boîte mail", "info");
  }

  return (
    <div className="space-y-5">
      {(linkError || error) && <p className="ui-alert-error">{linkError || error}</p>}
      {info && <p className="ui-alert-success">{info}</p>}
      {verifyHint && !linkError && !error && !info && (
        <p className="ui-alert-success">
          Compte créé — confirmez d&apos;abord votre email via le lien reçu à l&apos;inscription, puis
          connectez-vous ici.
        </p>
      )}

      {fromDevis && !linkError && !error && (
        <p className="text-body rounded-lg bg-[var(--surface-muted)] px-4 py-3 text-sm">
          Connectez-vous pour retrouver le devis créé sans compte — il sera enregistré automatiquement.
        </p>
      )}

      {!showPassword ? (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <p className="text-body text-center text-sm">
            Entrez votre email. Vous recevez un lien — <strong>comme un SMS</strong>, sans mot de passe.
          </p>
          <div>
            <label className="ui-label">Votre email</label>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input mt-1 text-base"
            />
          </div>
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
            {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
          <button
            type="button"
            onClick={() => setShowPassword(true)}
            className="text-body w-full text-center text-sm underline-offset-2 hover:underline"
          >
            J&apos;utilise un mot de passe
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="ui-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="ui-label">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input mt-1"
            />
          </div>
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            onToken={handleTurnstileToken}
            onExpire={handleTurnstileExpire}
            onError={handleTurnstileError}
            className="flex justify-center"
          />
          {turnstileError && <p className="text-body text-center text-sm text-red-600">{turnstileError}</p>}
          <button type="submit" disabled={loading} aria-busy={loading} className="ui-btn-primary w-full py-3">
            {loading ? "Connexion…" : "Se connecter"}
          </button>
          <button
            type="button"
            onClick={() => setShowPassword(false)}
            className="text-body w-full text-center text-sm underline-offset-2 hover:underline"
          >
            ← Connexion par email (plus simple)
          </button>
        </form>
      )}

      <p className="text-body border-t border-[var(--border)] pt-4 text-center text-sm">
        Nouveau ?{" "}
        <Link href={fromDevis ? `${ROUTES.inscription}?from=devis` : ROUTES.inscription} className="link-underline font-semibold">
          Créer un compte gratuit
        </Link>
      </p>
    </div>
  );
}
