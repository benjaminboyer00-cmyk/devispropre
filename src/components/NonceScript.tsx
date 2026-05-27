import type { ScriptHTMLAttributes } from "react";
import { getRequestNonce } from "@/lib/nonce";

type NonceScriptProps = ScriptHTMLAttributes<HTMLScriptElement>;

/** Script inline compatible CSP — suppressHydrationWarning évite le mismatch nonce SSR/client. */
export async function NonceScript(props: NonceScriptProps) {
  const nonce = await getRequestNonce();
  return <script {...props} nonce={nonce} suppressHydrationWarning />;
}
