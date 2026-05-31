"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

/** Ancien format /connexion/magic-link?token= — redirige auto vers la vérification API. */
export function MagicLinkCompleteForm({ token }: { token: string }) {
  useEffect(() => {
    if (!token) return;
    window.location.replace(
      `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`
    );
  }, [token]);

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="ui-alert-error">Ce lien de connexion est invalide ou incomplet.</p>
        <p className="text-body text-center text-sm">
          <Link href={ROUTES.connexion} className="link-underline font-medium">
            Demander un nouveau lien
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-body text-sm">Connexion en cours…</p>
      <p className="text-subtle text-xs">Redirection vers votre tableau de bord.</p>
    </div>
  );
}
