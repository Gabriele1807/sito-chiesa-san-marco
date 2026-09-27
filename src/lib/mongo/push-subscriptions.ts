/**
 * Iscrizioni alle notifiche push (un documento per browser/dispositivo).
 * Collezione: "push_subscriptions".
 *
 * Non contiene dati personali: solo l'indirizzo del servizio push del
 * browser, le chiavi di cifratura e la lingua. Le iscrizioni non più
 * valide (il servizio risponde 404/410) vengono eliminate all'invio.
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";

const COLLECTION = "push_subscriptions";

/**
 * Il server invia richieste HTTP all'`endpoint` fornito dal browser: si
 * accettano solo i servizi push dei browser principali, altrimenti chiunque
 * potrebbe far contattare al server un indirizzo arbitrario (SSRF).
 */
const ALLOWED_PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com", // Chrome, Edge (Chromium), Samsung Internet, Opera, Brave
  "android.googleapis.com",
  "push.services.mozilla.com", // Firefox
  "push.apple.com", // Safari (macOS, iOS 16.4+)
  "notify.windows.com", // Edge legacy / Windows
];

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  locale: "it" | "ar";
}

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_PUSH_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

/** Valida la PushSubscription (formato `subscription.toJSON()`) inviata dal browser. */
export function parsePushSubscription(
  value: unknown,
  locale: unknown
): PushSubscriptionRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const sub = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = sub.endpoint;
  const p256dh = sub.keys?.p256dh;
  const auth = sub.keys?.auth;
  if (typeof endpoint !== "string" || endpoint.length > 1024 || !isAllowedPushEndpoint(endpoint))
    return null;
  if (typeof p256dh !== "string" || p256dh.length > 256 || !BASE64URL.test(p256dh)) return null;
  if (typeof auth !== "string" || auth.length > 64 || !BASE64URL.test(auth)) return null;
  return { endpoint, keys: { p256dh, auth }, locale: locale === "ar" ? "ar" : "it" };
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ endpoint: 1 }, { unique: true });
  indexesEnsured = true;
}

export async function savePushSubscription(record: PushSubscriptionRecord): Promise<void> {
  await ensureIndexes();
  const c = await col();
  const now = new Date();
  await c.updateOne(
    { endpoint: record.endpoint },
    {
      $set: { keys: record.keys, locale: record.locale, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  if (typeof endpoint !== "string" || endpoint.length > 1024) return false;
  const c = await col();
  const result = await c.deleteOne({ endpoint });
  return result.deletedCount > 0;
}

export async function countPushSubscriptions(): Promise<{ total: number; it: number; ar: number }> {
  const c = await col();
  const [it, ar] = await Promise.all([
    c.countDocuments({ locale: { $ne: "ar" } }),
    c.countDocuments({ locale: "ar" }),
  ]);
  return { total: it + ar, it, ar };
}

/** Scorre tutte le iscrizioni a blocchi (per l'invio). */
export async function* iteratePushSubscriptions(
  batchSize = 200
): AsyncGenerator<PushSubscriptionRecord[]> {
  const c = await col();
  const cursor = c
    .find({}, { projection: { _id: 0, endpoint: 1, keys: 1, locale: 1 } })
    .batchSize(batchSize);
  let batch: PushSubscriptionRecord[] = [];
  for await (const doc of cursor) {
    batch.push({
      endpoint: doc.endpoint,
      keys: doc.keys,
      locale: doc.locale === "ar" ? "ar" : "it",
    });
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) yield batch;
}

export async function markPushDelivered(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return;
  const c = await col();
  await c.updateMany({ endpoint: { $in: endpoints } }, { $set: { lastSuccessAt: new Date() } });
}
