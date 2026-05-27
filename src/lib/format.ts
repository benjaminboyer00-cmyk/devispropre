export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function whatsAppShareUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function devisShareMessage(numero: string, clientName: string, shareUrl: string): string {
  return `Bonjour ${clientName}, voici votre devis n° ${numero} : ${shareUrl}\nMerci de votre confiance !`;
}

export function factureShareMessage(numero: string, clientName: string, shareUrl: string): string {
  return `Bonjour ${clientName}, voici votre facture n° ${numero} : ${shareUrl}\nMerci de votre confiance !`;
}
