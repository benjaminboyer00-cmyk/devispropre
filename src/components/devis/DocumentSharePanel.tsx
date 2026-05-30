"use client";

import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/ToastProvider";
import { escapeHtml } from "@/lib/html-escape";
import type { DocumentShareMessage } from "@/lib/share-utils";
import {
  documentShareDisplayText,
  documentShareHtml,
  documentShareWhatsAppText,
  mailShareHref,
  normalizePhone,
  openShareHref,
  smsShareHref,
  whatsAppShareHref,
} from "@/lib/share-utils";

interface DocumentSharePanelProps {
  title: string;
  subtitle?: string;
  shareUrl: string;
  shareMessage: DocumentShareMessage;
  clientPhone: string | null;
  emailSubject: string;
  variant?: "devis" | "facture";
}

const LINK_HINT: Record<"devis" | "facture", string> = {
  devis: "Cliquez sur « devis » pour consulter et signer le document.",
  facture: "Cliquez sur « facture » pour consulter le document.",
};

/** Panneau partage unifié — lien, message, WhatsApp, SMS, email. */
export function DocumentSharePanel({
  title,
  subtitle,
  shareUrl,
  shareMessage,
  clientPhone,
  emailSubject,
  variant = "devis",
}: DocumentSharePanelProps) {
  const { toast } = useToast();
  const phone = normalizePhone(clientPhone);
  const emailText = documentShareDisplayText(shareMessage);
  const emailHtml = documentShareHtml(shareMessage);
  const whatsAppText = documentShareWhatsAppText(shareMessage);
  const whatsAppHref = phone ? whatsAppShareHref(phone, whatsAppText) : null;
  const smsHref = phone ? smsShareHref(phone, whatsAppText) : null;
  const linkWord = variant === "facture" ? "facture" : "devis";

  const accent =
    variant === "facture"
      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30";

  async function openEmailComposer() {
    try {
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([emailHtml], { type: "text/html" }),
            "text/plain": new Blob([emailText], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(emailText);
      }
    } catch {
      toast("Impossible de copier — autorisez le presse-papier", "error");
      return;
    }

    openShareHref(mailShareHref(emailSubject, emailText));
    toast(`Messagerie ouverte — collez le message (Ctrl+V) pour le lien « ${linkWord} »`, "info");
  }

  return (
    <div className={`space-y-4 rounded-lg border p-4 ${accent}`}>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-body mt-1 text-sm">{subtitle}</p>}
      </div>

      <div className="rounded bg-white p-4 dark:bg-slate-900">
        <p className="text-subtle text-xs font-medium uppercase tracking-wide">Lien client</p>
        <p className="text-body mt-2 text-sm">{LINK_HINT[variant]}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-[var(--accent)] underline underline-offset-2"
          >
            {linkWord}
          </Link>
          <CopyButton
            text={shareUrl}
            html={`<a href="${escapeHtml(shareUrl)}">${escapeHtml(linkWord)}</a>`}
            label="Copier le lien"
            toastOnCopy={false}
          />
          <Link
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn-outline text-sm"
          >
            Aperçu client
          </Link>
        </div>
      </div>

      <div className="rounded bg-white p-3 text-sm dark:bg-slate-900">
        <p className="text-subtle mb-2 text-xs font-medium uppercase tracking-wide">WhatsApp / SMS</p>
        <p className="text-body whitespace-pre-wrap">{whatsAppText}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={whatsAppText} label="Copier pour WhatsApp" className="ui-btn-outline text-sm" />
        </div>
      </div>

      <div className="rounded bg-white p-3 text-sm dark:bg-slate-900">
        <p className="text-subtle mb-2 text-xs font-medium uppercase tracking-wide">Email</p>
        <div className="text-body whitespace-pre-wrap">
          <span>{shareMessage.beforeLink}</span>
          {"\n"}
          <Link
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent)] underline underline-offset-2"
          >
            {shareMessage.linkWord}
          </Link>
          <span>{shareMessage.afterLink}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton
            text={emailText}
            html={emailHtml}
            label="Copier pour email"
            className="ui-btn-outline text-sm"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {whatsAppHref ? (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => toast("Ouverture de WhatsApp…", "info")}
            className="rounded-lg bg-green-600 py-3 text-center text-sm font-semibold text-white hover:bg-green-700"
          >
            WhatsApp
          </a>
        ) : (
          <p className="text-body col-span-2 text-sm">
            Ajoutez le téléphone du client pour WhatsApp et SMS directs.
          </p>
        )}
        {smsHref && (
          <button
            type="button"
            onClick={() => {
              openShareHref(smsHref);
              toast("Ouverture de l'application SMS…", "info");
            }}
            className="ui-btn-outline py-3 text-center text-sm font-semibold"
          >
            SMS
          </button>
        )}
        <button
          type="button"
          onClick={openEmailComposer}
          className="ui-btn-outline py-3 text-center text-sm font-semibold sm:col-span-2"
        >
          Email
        </button>
      </div>
    </div>
  );
}
