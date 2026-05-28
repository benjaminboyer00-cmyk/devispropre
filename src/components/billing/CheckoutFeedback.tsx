"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

/** Toasts Stripe checkout success / cancel sur le dashboard. */
export function CheckoutFeedback() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      handled.current = true;
      toast("Paiement confirmé — votre abonnement est actif.");
    } else if (checkout === "cancel") {
      handled.current = true;
      toast("Paiement annulé — vous pouvez réessayer quand vous voulez.", "info");
    }
  }, [searchParams, toast]);

  return null;
}
