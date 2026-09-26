import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis client (HTTP-based, no persistent TCP connection —
 * the right fit for Vercel serverless functions). Backs rate limiting
 * (src/lib/auth/rate-limit.ts) and admin token revocation
 * (src/lib/auth/session.ts), both of which previously lived in per-process
 * memory and weren't actually shared across serverless instances (see
 * PROJECT_CONTEXT.md, security section).
 *
 * Returns null when no compatible REST URL/token pair is configured (e.g.
 * local dev without Redis set up) so callers can fall back to their previous
 * in-memory behavior instead of failing.
 */

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;

  // Upstash uses the UPSTASH_* names directly; the Vercel Marketplace
  // integration exposes the equivalent KV_REST_* names.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  client = url && token ? new Redis({ url, token }) : null;
  if (!client && process.env.NODE_ENV === "production") {
    // Su Vercel ogni istanza serverless ha la propria memoria: senza Redis il
    // rate limiting e la revoca delle sessioni admin al logout valgono solo
    // per l'istanza che gestisce la richiesta. Non blocca l'app, ma va visto.
    console.warn(
      "[redis] UPSTASH_REDIS_REST_URL/TOKEN (o KV_REST_API_URL/TOKEN) non configurate: " +
        "rate limiting e revoca sessioni admin usano la memoria della singola istanza."
    );
  }
  return client;
}
