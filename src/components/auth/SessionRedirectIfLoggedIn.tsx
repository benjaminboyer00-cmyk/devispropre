"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { claimGuestDraftIfPresent } from "@/lib/claim-guest-draft-client";
import { ROUTES } from "@/lib/routes";

/** Redirige vers le dashboard si une session existe (ex. retour navigateur après clic mail). */
export function SessionRedirectIfLoggedIn() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirectIfLoggedIn() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
        if (cancelled || !res.ok) return;

        const claim = await claimGuestDraftIfPresent();
        if (cancelled) return;

        if (claim.id) {
          router.replace(`${ROUTES.dashboardDevis(claim.id)}?claimed=1`);
        } else {
          router.replace(ROUTES.dashboard);
        }
        router.refresh();
      } catch {
        // Réseau instable — ne pas bloquer la page connexion.
      }
    }

    void redirectIfLoggedIn();

    const onVisible = () => {
      if (document.visibilityState === "visible") void redirectIfLoggedIn();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
