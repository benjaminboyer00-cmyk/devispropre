"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

export function CopyButton({
  text,
  label = "Copier",
  copiedLabel = "Copié !",
  className = "ui-btn-outline text-sm",
  toastOnCopy = true,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  toastOnCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (toastOnCopy) toast("Copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (toastOnCopy) toast("Impossible de copier — autorisez le presse-papier", "error");
    }
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? copiedLabel : label}
    </button>
  );
}
