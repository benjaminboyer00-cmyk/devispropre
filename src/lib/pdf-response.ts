/**
 * En-tête Content-Disposition sûr (RFC 6266 / 5987) : repli ASCII sans guillemets ni
 * caractères de contrôle + `filename*` UTF-8. Un nom non-Latin-1 brut ferait échouer `Headers`.
 */
export function contentDisposition(type: "inline" | "attachment", filename: string): string {
  const fallback =
    filename
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/["\\]/g, "_")
      .trim() || "document";
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/** En-têtes PDF — documents authentifiés : jamais en cache public partagé. */
export function pdfResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition("inline", filename),
      "Cache-Control": "private, no-store",
    },
  });
}
