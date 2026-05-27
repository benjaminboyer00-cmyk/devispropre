"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, magicLinkSchema, formatZodError } from "@/lib/schemas/forms";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const linkError =
    urlError === "lien_expire"
      ? "Ce lien a expiré. Demandez-en un nouveau ci-dessous."
      : urlError === "lien_invalide"
        ? "Lien invalide. Entrez votre email pour en recevoir un nouveau."
        : "";

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", ...parsed.data }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de connexion");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const parsed = magicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }

    setInfo("✉️ Lien envoyé — ouvrez votre email et cliquez pour vous connecter.");
  }

  return (
    <div className="space-y-5">
      {(linkError || error) && <p className="ui-alert-error">{linkError || error}</p>}
      {info && <p className="ui-alert-success">{info}</p>}

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
          <button type="submit" disabled={loading} className="ui-btn-primary w-full py-4 text-base">
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
          <button type="submit" disabled={loading} className="ui-btn-primary w-full py-3">
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
        <Link href="/inscription" className="link-underline font-semibold">
          Créer un compte gratuit
        </Link>
      </p>
    </div>
  );
}
