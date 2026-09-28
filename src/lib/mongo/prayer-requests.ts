/**
 * Richieste di preghiera / intenzioni per la liturgia inviate dal sito.
 * Collezione: "prayer_requests".
 *
 * Sono visibili solo agli admin. Dati ridotti al minimo: nome ed email
 * sono facoltativi (senza nome la richiesta è anonima). Le richieste
 * archiviate vengono cancellate automaticamente dopo 90 giorni (TTL su
 * `deleteAfter`), quelle nuove o lette restano finché un admin non le
 * archivia o elimina.
 *
 * ⚠️ Solo lato server.
 */

import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export const PRAYER_TYPES = ["malati", "defunti", "famiglia", "ringraziamento", "altro"] as const;
export type PrayerType = (typeof PRAYER_TYPES)[number];
export const PRAYER_STATES = ["nuova", "letta", "archiviata"] as const;
export type PrayerState = (typeof PRAYER_STATES)[number];

const ARCHIVE_RETENTION_DAYS = 90;
/** Richieste non archiviate da nessuno: archiviate da sole dopo questi giorni. */
export const AUTO_ARCHIVE_DAYS = 60;
const COLLECTION = "prayer_requests";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PrayerRequest {
  id: string;
  tipo: PrayerType;
  intenzione: string;
  nome?: string;
  email?: string;
  /** Il richiedente acconsente che l'intenzione (con i nomi) sia letta durante la liturgia. */
  leggibileInLiturgia: boolean;
  stato: PrayerState;
  locale: "it" | "ar";
  createdAt: string;
  updatedAt: string;
}

export type PrayerRequestInput = Pick<
  PrayerRequest,
  "tipo" | "intenzione" | "nome" | "email" | "leggibileInLiturgia"
>;

type ValidationResult = { ok: true; data: PrayerRequestInput } | { ok: false; error: string };

/** Valida il modulo pubblico. I codici di errore sono tradotti dal client. */
export function validatePrayerRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return { ok: false, error: "invalid" };
  const b = body as Record<string, unknown>;

  if (b.consenso !== true) return { ok: false, error: "consent" };
  if (!PRAYER_TYPES.includes(b.tipo as PrayerType)) return { ok: false, error: "tipo" };

  const intenzione = typeof b.intenzione === "string" ? b.intenzione.trim() : "";
  if (intenzione.length < 3 || intenzione.length > 1500) return { ok: false, error: "intenzione" };

  const nome = b.nome === undefined || b.nome === null ? "" : b.nome;
  if (typeof nome !== "string" || nome.trim().length > 100) return { ok: false, error: "nome" };

  const email = b.email === undefined || b.email === null ? "" : b.email;
  if (
    typeof email !== "string" ||
    email.length > 200 ||
    (email.trim() && !EMAIL_REGEX.test(email.trim()))
  ) {
    return { ok: false, error: "email" };
  }

  if (b.leggibileInLiturgia !== undefined && typeof b.leggibileInLiturgia !== "boolean") {
    return { ok: false, error: "invalid" };
  }

  return {
    ok: true,
    data: {
      tipo: b.tipo as PrayerType,
      intenzione,
      nome: nome.trim() || undefined,
      email: email.trim().toLowerCase() || undefined,
      leggibileInLiturgia: b.leggibileInLiturgia === true,
    },
  };
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await Promise.all([
    c.createIndex({ id: 1 }, { unique: true }),
    c.createIndex({ stato: 1, createdAt: -1 }),
    c.createIndex({ deleteAfter: 1 }, { expireAfterSeconds: 0 }),
  ]);
  indexesEnsured = true;
}

function toPrayerRequest(doc: Record<string, unknown>): PrayerRequest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, deleteAfter, ...rest } = doc;
  return rest as unknown as PrayerRequest;
}

export async function createPrayerRequest(
  data: PrayerRequestInput,
  locale: "it" | "ar"
): Promise<PrayerRequest> {
  await ensureIndexes();
  const c = await col();
  const now = new Date().toISOString();
  const request: PrayerRequest = {
    ...data,
    id: randomUUID(),
    stato: "nuova",
    locale,
    createdAt: now,
    updatedAt: now,
  };
  await c.insertOne({ ...request });
  return request;
}

/**
 * Archivia le richieste più vecchie di AUTO_ARCHIVE_DAYS non ancora
 * archiviate: contengono dati delicati (salute, fede) e non devono restare
 * per sempre se nessuno le gestisce. Dopo l'archiviazione vale la
 * cancellazione automatica a 90 giorni. Chiamata dal job giornaliero e
 * all'apertura della pagina admin. Restituisce quante ne ha archiviate.
 */
export async function archiveStalePrayerRequests(now = new Date()): Promise<number> {
  await ensureIndexes();
  const c = await col();
  const cutoff = new Date(now.getTime() - AUTO_ARCHIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = await c.updateMany(
    { stato: { $ne: "archiviata" }, createdAt: { $lt: cutoff } },
    {
      $set: {
        stato: "archiviata",
        deleteAfter: new Date(now.getTime() + ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        updatedAt: now.toISOString(),
      },
    }
  );
  return result.modifiedCount;
}

export async function listPrayerRequests(stato?: PrayerState): Promise<PrayerRequest[]> {
  await ensureIndexes();
  const c = await col();
  const filter = stato && PRAYER_STATES.includes(stato) ? { stato } : {};
  const docs = await c.find(filter).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map((d) => toPrayerRequest(d));
}

export async function countPrayerRequestsByState(): Promise<Record<PrayerState, number>> {
  await ensureIndexes();
  const c = await col();
  const rows = await c
    .aggregate<{ _id: PrayerState; count: number }>([
      { $group: { _id: "$stato", count: { $sum: 1 } } },
    ])
    .toArray();
  const counts: Record<PrayerState, number> = { nuova: 0, letta: 0, archiviata: 0 };
  for (const row of rows) if (row._id in counts) counts[row._id] = row.count;
  return counts;
}

export async function setPrayerRequestState(
  id: string,
  stato: PrayerState
): Promise<PrayerRequest | null> {
  if (!PRAYER_STATES.includes(stato)) return null;
  const c = await col();
  const deleteAfter =
    stato === "archiviata"
      ? new Date(Date.now() + ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
      : null;
  const doc = await c.findOneAndUpdate(
    { id },
    // Riaprire una richiesta archiviata annulla la cancellazione programmata.
    deleteAfter
      ? { $set: { stato, deleteAfter, updatedAt: new Date().toISOString() } }
      : { $set: { stato, updatedAt: new Date().toISOString() }, $unset: { deleteAfter: "" } },
    { returnDocument: "after" }
  );
  return doc ? toPrayerRequest(doc) : null;
}

export async function deletePrayerRequest(id: string): Promise<boolean> {
  const c = await col();
  const result = await c.deleteOne({ id });
  return result.deletedCount > 0;
}
