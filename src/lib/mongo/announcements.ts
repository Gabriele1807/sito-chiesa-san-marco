/**
 * Avvisi e annunci della comunità ("Liturgia spostata alle 10", "Chiesa
 * chiusa lunedì"…). Collezione: "avvisi".
 *
 * Ogni avviso ha un livello (info / importante / urgente), un periodo di
 * pubblicazione opzionale (inizio, scadenza) e un testo arabo opzionale:
 * senza traduzione i visitatori in arabo vedono il testo italiano.
 * Gli avvisi scaduti restano nel pannello admin ma spariscono dal sito
 * senza intervento manuale.
 *
 * ⚠️ Solo lato server.
 */

import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import { isSafeUrl } from "@/lib/admin/content-validation";

export const AVVISO_LEVELS = ["info", "importante", "urgente"] as const;
export type AvvisoLevel = (typeof AVVISO_LEVELS)[number];

export interface Avviso {
  id: string;
  titolo: string;
  messaggio: string;
  titoloAr?: string;
  messaggioAr?: string;
  livello: AvvisoLevel;
  /** Link opzionale (pagina del sito o http/https). */
  link?: string;
  /** ISO 8601; se assente l'avviso è visibile subito. */
  inizio?: string;
  /** ISO 8601; se assente l'avviso non scade. */
  scadenza?: string;
  pubblicato: boolean;
  createdAt: string;
  updatedAt: string;
  /** Ultimo invio della notifica push per questo avviso. */
  pushSentAt?: string;
}

export type AvvisoInput = Pick<
  Avviso,
  | "titolo"
  | "messaggio"
  | "titoloAr"
  | "messaggioAr"
  | "livello"
  | "link"
  | "inizio"
  | "scadenza"
  | "pubblicato"
>;

const COLLECTION = "avvisi";
const LEVEL_ORDER: Record<AvvisoLevel, number> = { urgente: 0, importante: 1, info: 2 };

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await Promise.all([
    c.createIndex({ id: 1 }, { unique: true }),
    c.createIndex({ pubblicato: 1, scadenza: 1 }),
  ]);
  indexesEnsured = true;
}

function toAvviso(doc: Record<string, unknown>): Avviso {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as unknown as Avviso;
}

// --------------- Validazione ---------------

type ValidationResult = { ok: true; data: Partial<AvvisoInput> } | { ok: false; error: string };

function optionalText(value: unknown, max: number): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > max) return null;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optionalDate(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > 40) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Valida il body inviato dal pannello admin. In creazione titolo e
 * messaggio sono obbligatori; in modifica solo i campi presenti vengono
 * aggiornati. Campi sconosciuti ignorati.
 */
export function validateAvviso(body: unknown, mode: "create" | "update"): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Dati non validi" };
  }
  const b = body as Record<string, unknown>;
  const data: Partial<AvvisoInput> = {};
  const has = (key: string) => Object.prototype.hasOwnProperty.call(b, key) && b[key] !== undefined;

  for (const [key, max] of [
    ["titolo", 160],
    ["messaggio", 2000],
  ] as const) {
    if (has(key) || mode === "create") {
      const value = optionalText(b[key], max);
      if (value === null)
        return { ok: false, error: `Campo "${key}" non valido (massimo ${max} caratteri)` };
      if (!value) return { ok: false, error: `Campo "${key}" obbligatorio` };
      data[key] = value;
    }
  }

  for (const [key, max] of [
    ["titoloAr", 160],
    ["messaggioAr", 2000],
  ] as const) {
    if (has(key)) {
      const value = optionalText(b[key], max);
      if (value === null)
        return { ok: false, error: `Campo "${key}" non valido (massimo ${max} caratteri)` };
      data[key] = value ?? "";
    }
  }

  if (has("livello") || mode === "create") {
    const livello = b.livello ?? "info";
    if (!AVVISO_LEVELS.includes(livello as AvvisoLevel))
      return { ok: false, error: "Livello non valido" };
    data.livello = livello as AvvisoLevel;
  }

  if (has("link")) {
    const link = optionalText(b.link, 2048);
    if (link === null || (link && !isSafeUrl(link))) {
      return {
        ok: false,
        error: "Link non valido: usa un indirizzo http(s) o una pagina del sito (/...)",
      };
    }
    data.link = link ?? "";
  }

  for (const key of ["inizio", "scadenza"] as const) {
    if (has(key)) {
      const value = optionalDate(b[key]);
      if (value === null) return { ok: false, error: `Data "${key}" non valida` };
      data[key] = value ?? "";
    }
  }
  if (data.inizio && data.scadenza && data.scadenza <= data.inizio) {
    return { ok: false, error: "La scadenza deve essere successiva all'inizio" };
  }

  if (has("pubblicato") || mode === "create") {
    const pubblicato = b.pubblicato ?? true;
    if (typeof pubblicato !== "boolean") return { ok: false, error: "Campo pubblicato non valido" };
    data.pubblicato = pubblicato;
  }

  return { ok: true, data };
}

// --------------- Lettura ---------------

/** Tutti gli avvisi (pannello admin), più recenti prima. */
export async function listAvvisi(): Promise<Avviso[]> {
  await ensureIndexes();
  const c = await col();
  const docs = await c.find({}).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map((d) => toAvviso(d));
}

/** Avvisi pubblicati e non ancora scaduti (il filtro sull'inizio si applica in `filterActiveAvvisi`). */
export async function listPublishedAvvisi(now = new Date()): Promise<Avviso[]> {
  await ensureIndexes();
  const c = await col();
  const docs = await c
    .find({
      pubblicato: true,
      $or: [
        { scadenza: { $exists: false } },
        { scadenza: "" },
        { scadenza: { $gt: now.toISOString() } },
      ],
    })
    .limit(100)
    .toArray();
  return docs.map((d) => toAvviso(d));
}

/**
 * Filtra per periodo di pubblicazione e ordina per importanza (urgente
 * prima), poi dal più recente. Separato dalla query perché la lista viene
 * messa in cache per qualche secondo mentre l'orario corrente cambia.
 */
export function filterActiveAvvisi(avvisi: Avviso[], now = new Date()): Avviso[] {
  const nowIso = now.toISOString();
  return avvisi
    .filter(
      (a) =>
        a.pubblicato && (!a.inizio || a.inizio <= nowIso) && (!a.scadenza || a.scadenza > nowIso)
    )
    .sort(
      (a, b) =>
        LEVEL_ORDER[a.livello] - LEVEL_ORDER[b.livello] || b.createdAt.localeCompare(a.createdAt)
    );
}

export async function getAvvisoById(id: string): Promise<Avviso | null> {
  const c = await col();
  const doc = await c.findOne({ id });
  return doc ? toAvviso(doc) : null;
}

// --------------- Scrittura ---------------

export async function createAvviso(data: AvvisoInput): Promise<Avviso> {
  await ensureIndexes();
  const c = await col();
  const now = new Date().toISOString();
  const avviso: Avviso = {
    ...data,
    livello: data.livello ?? "info",
    pubblicato: data.pubblicato ?? true,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await c.insertOne({ ...avviso });
  return avviso;
}

export async function updateAvviso(id: string, data: Partial<AvvisoInput>): Promise<Avviso | null> {
  const c = await col();
  const doc = await c.findOneAndUpdate(
    { id },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return doc ? toAvviso(doc) : null;
}

export async function markAvvisoPushSent(id: string): Promise<void> {
  const c = await col();
  await c.updateOne({ id }, { $set: { pushSentAt: new Date().toISOString() } });
}

export async function deleteAvviso(id: string): Promise<boolean> {
  const c = await col();
  const result = await c.deleteOne({ id });
  return result.deletedCount > 0;
}

/** Testo nella lingua del visitatore, con ripiego sull'italiano. */
export function localizeAvviso(
  avviso: Avviso,
  locale: string
): { titolo: string; messaggio: string } {
  if (locale === "ar") {
    return {
      titolo: avviso.titoloAr?.trim() || avviso.titolo,
      messaggio: avviso.messaggioAr?.trim() || avviso.messaggio,
    };
  }
  return { titolo: avviso.titolo, messaggio: avviso.messaggio };
}
