"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { claimGuestDraftIfPresent } from "@/lib/claim-guest-draft-client";
import { loadPendingDevisId } from "@/lib/guest-devis-draft";
import { ROUTES } from "@/lib/routes";

/** Rattache le brouillon invité après connexion (magic link, etc.). */
export function ClaimGuestDraftOnMount() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const existing = loadPendingDevisId();
      if (existing) return;

      const claim = await claimGuestDraftIfPresent();
      if (cancelled) return;
      if (claim.error) {
        console.warn("[claim-draft]", claim.error);
      }
      if (!claim.id) return;
      router.replace(`${ROUTES.dashboardDevis(claim.id)}?claimed=1`);
      router.refresh();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
