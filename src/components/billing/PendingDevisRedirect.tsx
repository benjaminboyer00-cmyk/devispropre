"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearPendingDevisId, loadPendingDevisId } from "@/lib/guest-devis-draft";
import { ROUTES } from "@/lib/routes";

/** Après checkout Stripe réussi → ouvre le devis en attente. */
export function PendingDevisRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    const id = loadPendingDevisId();
    if (!id) return;
    clearPendingDevisId();
    router.replace(`${ROUTES.dashboardDevis(id)}?ready=1`);
  }, [router, searchParams]);

  return null;
}
