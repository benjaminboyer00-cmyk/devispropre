import { headers } from "next/headers";

/** Nonce CSP injecté par proxy.ts — undefined si absent (évite nonce="" en SSR). */
export async function getRequestNonce(): Promise<string | undefined> {
  const value = (await headers()).get("x-nonce");
  return value && value.length > 0 ? value : undefined;
}
