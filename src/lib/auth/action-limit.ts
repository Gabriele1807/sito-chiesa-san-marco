/**
 * Limiti per singola azione pubblica (registrazione, richieste di preghiera,
 * iscrizioni alle notifiche, iscrizioni agli eventi).
 *
 * Il limite generico di rate-limit.ts (60 richieste/minuto per IP, condiviso
 * tra più route) è pensato contro le raffiche, non contro l'abuso di singole
 * azioni che inviano email o riempiono il database. Qui ogni azione ha il
 * proprio tetto su una finestra lunga (es. 5 all'ora).
 *
 * Contatori in MongoDB ("action_rate_limits"), non in memoria: sono
 * condivisi tra tutte le istanze serverless anche senza Redis. Finestra
 * fissa; `$inc` con upsert è atomico, un indice TTL pulisce i contatori.
 *
 * ⚠️ Solo lato server.
 */

import { createHash } from "node:crypto";
import { getDb } from "@/lib/mongo/client";

const COLLECTION = "action_rate_limits";

export interface ActionLimit {
  /** Nome dell'azione, es. "register". */
  action: string;
  max: number;
  windowSeconds: number;
}

export const LIMITS = {
  register: { action: "register", max: 5, windowSeconds: 60 * 60 },
  prayerRequest: { action: "prayer-request", max: 5, windowSeconds: 60 * 60 },
  pushSubscribe: { action: "push-subscribe", max: 10, windowSeconds: 60 * 60 },
  eventRegistration: { action: "event-registration", max: 20, windowSeconds: 60 * 60 },
} satisfies Record<string, ActionLimit>;

let indexesEnsured = false;

async function col() {
  const c = (await getDb()).collection<{ _id: string; count: number; expiresAt: Date }>(COLLECTION);
  if (!indexesEnsured) {
    await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexesEnsured = true;
  }
  return c;
}

/**
 * Conta un tentativo dell'azione per `subject` (IP o id account) e dice se
 * è ancora entro il limite. Il soggetto è salvato solo come hash.
 */
export async function consumeActionLimit(
  limit: ActionLimit,
  subject: string,
  now = new Date()
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowMs = limit.windowSeconds * 1000;
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const subjectHash = createHash("sha256").update(subject).digest("hex").slice(0, 32);
  const c = await col();
  const doc = await c.findOneAndUpdate(
    { _id: `${limit.action}:${subjectHash}:${windowStart}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
    { upsert: true, returnDocument: "after" }
  );
  const count = doc?.count ?? 1;
  return {
    allowed: count <= limit.max,
    retryAfterSeconds: Math.ceil((windowStart + windowMs - now.getTime()) / 1000),
  };
}
