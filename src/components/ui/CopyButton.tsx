"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copier",
  copiedLabel = "Copié !",
  className = "ui-btn-outline text-sm",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard refusé */
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? copiedLabel : label}
    </button>
  );
}
