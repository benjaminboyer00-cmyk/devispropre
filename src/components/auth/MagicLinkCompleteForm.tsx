"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export function MagicLinkCompleteForm({ token }: { token: string }) {
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

  const completeLogin = () => {
    window.location.href = `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-body text-sm">
        Pour des raisons de sécurité, confirmez ci-dessous pour ouvrir votre tableau de bord.
      </p>
      <button
        type="button"
        onClick={completeLogin}
        className="ui-btn-primary w-full py-4 text-base"
      >
        Accéder à mon compte
      </button>
      <p className="text-body text-center text-sm">
        Le lien expire 15 minutes après l&apos;envoi de l&apos;email.
      </p>
    </div>
  );
}
