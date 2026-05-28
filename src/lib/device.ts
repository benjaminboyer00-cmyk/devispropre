/** Safari iOS et mobile : préférer téléchargement PDF plutôt qu'iframe/embed. */
export function preferPdfDownload(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobile = /Android|webOS|Mobile/i.test(ua) || isIos;
  return isMobile;
}
