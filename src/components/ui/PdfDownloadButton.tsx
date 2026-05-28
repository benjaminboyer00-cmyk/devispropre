"use client";

import { preferPdfDownload } from "@/lib/device";

interface PdfDownloadButtonProps {
  href: string;
  filename?: string;
  className?: string;
  label?: string;
}

/** Lien PDF adapté mobile (iOS Safari) — téléchargement explicite au lieu d'un iframe. */
export function PdfDownloadButton({
  href,
  filename,
  className = "ui-btn-outline text-sm",
  label = "📄 Voir / télécharger le PDF",
}: PdfDownloadButtonProps) {
  const mobile = preferPdfDownload();

  if (mobile) {
    return (
      <a
        href={href}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} inline-flex items-center justify-center gap-2 py-3`}
      >
        {label}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label.replace("📄 ", "")}
    </a>
  );
}
