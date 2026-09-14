/**
 * Cookie firmati per il flusso OAuth: `oauth_flow` (state/PKCE, 10 minuti,
 * cancellato dopo un solo uso) e `oauth_pending` (identità in attesa del
 * quiz, 30 minuti). Riusa signJwt/verifyJwt — nessun secondo sistema di
 * firma. Vedi design spec §3.1, §3.3.
 */

import { signJwt, verifyJwt } from "@/lib/auth/jwt";

export type OAuthIntent = "login" | "register" | "link";

export interface OAuthFlowPayload {
  state: string;
  provider: "google" | "facebook";
  intent: OAuthIntent;
  returnTo: string;
  codeVerifier?: string;
  linkedSessionHash?: string;
}

const FLOW_TTL_SECONDS = 10 * 60;
const PENDING_TTL_SECONDS = 30 * 60;

export async function signOAuthFlowCookie(payload: OAuthFlowPayload): Promise<string> {
  return signJwt(
    { sub: "oauth_flow", sessionType: "oauth_flow", ...payload },
    FLOW_TTL_SECONDS
  );
}

export async function verifyOAuthFlowCookie(token: string): Promise<OAuthFlowPayload | null> {
  const payload = await verifyJwt<OAuthFlowPayload & { sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "oauth_flow") return null;
  const { state, provider, intent, returnTo, codeVerifier, linkedSessionHash } = payload;
  if (!state || !provider || !intent || !returnTo) return null;
  return { state, provider, intent, returnTo, codeVerifier, linkedSessionHash };
}

export async function signOAuthPendingCookie(pendingId: string): Promise<string> {
  return signJwt(
    { sub: pendingId, sessionType: "oauth_pending" },
    PENDING_TTL_SECONDS
  );
}

export async function verifyOAuthPendingCookie(
  token: string
): Promise<{ pendingId: string } | null> {
  const payload = await verifyJwt<{ sub: string; sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "oauth_pending" || !payload.sub) return null;
  return { pendingId: payload.sub };
}

export async function hashSessionToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
