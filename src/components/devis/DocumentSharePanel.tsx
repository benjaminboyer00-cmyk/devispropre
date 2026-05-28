"use client";

import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/ToastProvider";
import { mailShareHref, normalizePhone, smsShareHref, whatsAppShareHref } from "@/lib/share-utils";

interface DocumentSharePanelProps {
  title: string;
  subtitle?: string;
  shareUrl: string;
  message: string;
  clientPhone: string | null;
  emailSubject: string;
  variant?: "devis" | "facture";
}

/** Panneau partage unifié — lien, message, WhatsApp, SMS, email. */
export function DocumentSharePanel({
  title,
  subtitle,
  shareUrl,
  message,
  clientPhone,
  emailSubject,
  variant = "devis",
}: DocumentSharePanelProps) {
  const { toast } = useToast();
  const phone = normalizePhone(clientPhone);
  const whatsAppHref = phone ? whatsAppShareHref(phone, message) : null;
  const smsHref = phone ? smsShareHref(phone, message) : null;
  const mailHref = mailShareHref(emailSubject, message);

  const accent =
    variant === "facture"
      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30";

  return (
    <div className={`space-y-4 rounded-lg border p-4 ${accent}`}>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-body mt-1 text-sm">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <code className="text-body max-w-full min-w-0 flex-1 truncate rounded bg-white px-3 py-2 text-xs dark:bg-slate-900">
          {shareUrl}
        </code>
        <CopyButton text={shareUrl} label="Copier le lien" />
        <Link
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-btn-outline text-sm"
        >
          Aperçu client
        </Link>
      </div>

      <div className="rounded bg-white p-3 text-sm dark:bg-slate-900">
        <p className="text-subtle mb-1 text-xs">Message suggéré</p>
        <p className="text-body whitespace-pre-wrap">{message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={message} label="Copier le message" className="ui-btn-outline text-sm" />
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
          <a
            href={smsHref}
            onClick={() => toast("Ouverture de l'application SMS…", "info")}
            className="ui-btn-outline py-3 text-center text-sm font-semibold"
          >
            SMS
          </a>
        )}
        <a href={mailHref} className="ui-btn-outline py-3 text-center text-sm font-semibold sm:col-span-2">
          Email (message pré-rempli)
        </a>
      </div>
    </div>
  );
}
