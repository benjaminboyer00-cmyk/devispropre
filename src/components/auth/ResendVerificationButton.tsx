"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

export function ResendVerificationButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  async function handleResend() {
    setLoading(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({} as { error?: string; message?: string }));
    setLoading(false);

    if (!res.ok) {
      toast(data.error ?? "Impossible de renvoyer l'email.", "error");
      return;
    }

    setSent(true);
    toast("Email renvoyé — vérifiez votre boîte mail.", "info");
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={loading || sent}
      className="ui-btn-outline w-full py-3 text-sm"
    >
      {loading ? "Envoi…" : sent ? "Email renvoyé" : "Renvoyer l'email de confirmation"}
    </button>
  );
}
