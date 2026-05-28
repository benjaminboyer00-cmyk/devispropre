/** Validation stricte du payload signature canvas (PNG base64, max 100 Ko décodé). */
const PNG_DATA_URI_PREFIX = "data:image/png;base64,";
const SIGNATURE_DATA_URI_MAX = 102_400;
const SIGNATURE_DECODED_MAX_BYTES = 100 * 1024;

export function validateClientSignatureDataUri(data: string): boolean {
  if (!data.startsWith(PNG_DATA_URI_PREFIX)) return false;
  if (data.length > SIGNATURE_DATA_URI_MAX) return false;

  const b64 = data.slice(PNG_DATA_URI_PREFIX.length);
  if (!/^[A-Za-z0-9+/=]+$/.test(b64)) return false;

  try {
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 0 || buf.length > SIGNATURE_DECODED_MAX_BYTES) return false;
    // Magic bytes PNG
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  } catch {
    return false;
  }
}
