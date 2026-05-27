"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, magicLinkSchema, formatZodError } from "@/lib/schemas/forms";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<"password" | "magic">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const linkError =
    urlError === "lien_expire"
      ? "Ce lien de connexion a expiré ou a déjà été utilisé."
      : urlError === "lien_invalide"
        ? "Lien de connexion invalide."
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

    setInfo(data.message ?? "Email envoyé si le compte existe.");
  }

  return (
    <div className="space-y-4">
      {(linkError || error) && <p className="ui-alert-error">{linkError || error}</p>}
      {info && <p className="ui-alert-success">{info}</p>}

      <div className="flex rounded-lg border border-[var(--border)] p-1">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === "password" ? "bg-blue-600 text-white" : "text-body"}`}
        >
          Mot de passe
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === "magic" ? "bg-blue-600 text-white" : "text-body"}`}
        >
          Lien par email
        </button>
      </div>

      {mode === "password" ? (
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
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <p className="text-body text-sm">
            Recevez un lien sécurisé par email — simple comme un SMS, sans mot de passe.
          </p>
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
          <button type="submit" disabled={loading} className="ui-btn-primary w-full py-3">
            {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
        </form>
      )}

      <p className="text-body text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="link-underline font-medium">
          Inscription gratuite
        </Link>
      </p>
    </div>
  );
}
