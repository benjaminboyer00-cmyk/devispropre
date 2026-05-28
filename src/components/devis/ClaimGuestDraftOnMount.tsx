"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { claimGuestDraftIfPresent } from "@/lib/claim-guest-draft-client";
import { loadPendingDevisId } from "@/lib/guest-devis-draft";
import { ROUTES } from "@/lib/routes";
import { useToast } from "@/components/ui/ToastProvider";

/** Rattache le brouillon invité après connexion (magic link, etc.). */
export function ClaimGuestDraftOnMount() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const pendingId = loadPendingDevisId();
      if (pendingId) {
        router.replace(`${ROUTES.dashboardDevis(pendingId)}?claimed=1`);
        return;
      }

      const claim = await claimGuestDraftIfPresent();
      if (cancelled) return;

      if (claim.error) {
        toast(claim.error, "error");
      }
      if (!claim.id) return;

      router.replace(`${ROUTES.dashboardDevis(claim.id)}?claimed=1`);
      router.refresh();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  return null;
}
