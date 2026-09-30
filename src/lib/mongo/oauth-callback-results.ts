/**
 * Esito dei callback OAuth, per rendere il callback idempotente.
 * Collezione: "oauth_callback_results", TTL 10 minuti (come il cookie oauth_flow).
 *
 * Perché: nell'app installata (PWA) su Android, dopo il consenso Google il
 * browser può caricare due volte lo stesso URL di ritorno (nella scheda del
 * provider e poi nella finestra dell'app). Il `code` OAuth vale una volta
 * sola: la seconda richiesta falliva lo scambio (`provider_error`) o non
 * trovava più il cookie (`invalid_state`) e mostrava un errore anche quando
 * la prima aveva già fatto accedere l'utente. Ora la prima richiesta
 * "prenota" lo `state` e salva dove ha mandato l'utente; le successive con
 * lo stesso `state` vanno nello stesso posto. I cookie di sessione impostati
 * dalla prima valgono anche per la seconda (stesso browser).
 *
 * Lo `state` è salvato solo come hash SHA-256; il redirect salvato è un
 * percorso relativo del sito calcolato dal server, mai un URL esterno.
 *
 * ⚠️ Solo lato server.
 */

import { createHash } from "node:crypto";
import { getDb } from "./client";

const COLLECTION = "oauth_callback_results";
const TTL_MS = 10 * 60 * 1000;

interface CallbackResultDoc {
  _id: string;
  status: "processing" | "done";
  /** Percorso relativo (con query) dove è stato mandato l'utente. */
  redirect?: string;
  expiresAt: Date;
}

export function oauthStateKey(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

function col() {
  return getDb().then((db) => db.collection<CallbackResultDoc>(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  indexesEnsured = true;
}

/** true se questa richiesta è la prima con questo state (e quindi lo elabora). */
export async function claimOAuthCallback(key: string): Promise<boolean> {
  await ensureIndexes();
  const c = await col();
  try {
    await c.insertOne({
      _id: key,
      status: "processing",
      expiresAt: new Date(Date.now() + TTL_MS),
    });
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return false;
    throw err;
  }
}

export async function completeOAuthCallback(key: string, redirect: string): Promise<void> {
  const c = await col();
  await c.updateOne({ _id: key }, { $set: { status: "done", redirect } });
}

export async function hasOAuthCallback(key: string): Promise<boolean> {
  const c = await col();
  return (await c.countDocuments({ _id: key }, { limit: 1 })) > 0;
}

/**
 * Aspetta che la prima richiesta con questo state finisca e restituisce il
 * suo redirect; null se non finisce entro `timeoutMs`.
 */
export async function waitForOAuthCallback(
  key: string,
  timeoutMs = 8000,
  intervalMs = 300
): Promise<string | null> {
  const c = await col();
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const doc = await c.findOne({ _id: key });
    if (doc?.status === "done" && doc.redirect) return doc.redirect;
    if (Date.now() >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
