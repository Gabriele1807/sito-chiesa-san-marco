/**
 * MongoDB content layer — persistenza dei contenuti del sito.
 *
 * Collezioni su Atlas (stesso DB degli utenti normali):
 *   icone, testi_sacri, preghiere, eventi, orari_settimanali, file_privati
 *
 * Al primo avvio le collezioni vuote vengono popolate dai dati mock.
 * Le modifiche dell'admin sopravvivono a qualsiasi riavvio del server.
 *
 * ⚠️ NON importare in codice client / "use client".
 */

import { getDb } from "@/lib/mongo/client";
import type { Icona, TestoSacro, Preghiera, VideoCorso, Evento, OrarioSettimanale } from "@/types";
import type { FilePrivato } from "@/lib/data/store";
import {
  icone as iconeInit,
  testiSacri as testiSacriInit,
  preghiere as preghiereInit,
  videoCorsi as videoCorsiInit,
  eventi as eventiInit,
  orariSettimanali as orariInit,
} from "@/lib/mock-data";

// ============================================================
//  HELPERS
// ============================================================

// Rimuove _id MongoDB prima di restituire il documento al client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T>(doc: any): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as T;
}

// Genera ID stringa numerica incrementale (compatibile con lo store)
async function nextId(colName: string): Promise<string> {
  const db = await getDb();
  const docs = await db.collection(colName).find({}, { projection: { id: 1 } }).toArray();
  const max = docs.reduce((m, d) => Math.max(m, parseInt(d.id as string) || 0), 0);
  return String(max + 1);
}

// Flag per indici — su globalThis per sopravvivere all'HMR in sviluppo
const g = globalThis as unknown as {
  _mongoContentIndexes?: boolean;
  _mongoContentSeeded?: Record<string, boolean>;
};
if (!g._mongoContentSeeded) g._mongoContentSeeded = {};

async function ensureIndexes(): Promise<void> {
  if (g._mongoContentIndexes) return;
  const db = await getDb();
  await Promise.all([
    db.collection("icone").createIndex({ id: 1 }, { unique: true }),
    db.collection("icone").createIndex({ slug: 1 }, { unique: true }),
    db.collection("testi_sacri").createIndex({ id: 1 }, { unique: true }),
    db.collection("testi_sacri").createIndex({ slug: 1 }, { unique: true }),
    db.collection("preghiere").createIndex({ id: 1 }, { unique: true }),
    db.collection("preghiere").createIndex({ slug: 1 }, { sparse: true, unique: true }),
    db.collection("video_corsi").createIndex({ id: 1 }, { unique: true }),
    db.collection("eventi").createIndex({ id: 1 }, { unique: true }),
    db.collection("eventi").createIndex({ slug: 1 }, { unique: true }),
    db.collection("orari_settimanali").createIndex({ giorno: 1 }, { unique: true }),
    db.collection("file_privati").createIndex({ id: 1 }, { unique: true }),
  ]);
  g._mongoContentIndexes = true;
}

// Popola la collezione dai mock solo se è vuota (una volta sola)
async function seedIfEmpty(colName: string, data: object[]): Promise<void> {
  if (g._mongoContentSeeded![colName]) return;
  const db = await getDb();
  const count = await db.collection(colName).countDocuments();
  if (count === 0 && data.length > 0) {
    await db.collection(colName).insertMany(data.map((d) => ({ ...d })));
  }
  g._mongoContentSeeded![colName] = true;
}

// ============================================================
//  ICONE
// ============================================================

export async function getIcone(): Promise<Icona[]> {
  await ensureIndexes();
  await seedIfEmpty("icone", iconeInit);
  const db = await getDb();
  return (await db.collection("icone").find({}).toArray()).map((d) => clean<Icona>(d));
}

export async function getIconaById(id: string): Promise<Icona | undefined> {
  const db = await getDb();
  const doc = await db.collection("icone").findOne({ id });
  return doc ? clean<Icona>(doc) : undefined;
}

export async function getIconaBySlug(slug: string): Promise<Icona | undefined> {
  const db = await getDb();
  const doc = await db.collection("icone").findOne({ slug });
  return doc ? clean<Icona>(doc) : undefined;
}

export async function addIcona(data: Omit<Icona, "id">): Promise<Icona> {
  await ensureIndexes();
  const id = await nextId("icone");
  const nuova: Icona = { ...data, id };
  const db = await getDb();
  await db.collection("icone").insertOne({ ...nuova });
  return nuova;
}

export async function updateIcona(id: string, data: Partial<Icona>): Promise<Icona | null> {
  const db = await getDb();
  const result = await db.collection("icone").findOneAndUpdate(
    { id },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ? clean<Icona>(result) : null;
}

export async function deleteIcona(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("icone").deleteOne({ id });
  return result.deletedCount > 0;
}

// ============================================================
//  TESTI SACRI (Libreria)
// ============================================================

export async function getLibri(): Promise<TestoSacro[]> {
  await ensureIndexes();
  await seedIfEmpty("testi_sacri", testiSacriInit);
  const db = await getDb();
  return (await db.collection("testi_sacri").find({}).toArray()).map((d) => clean<TestoSacro>(d));
}

export async function getLibroById(id: string): Promise<TestoSacro | undefined> {
  const db = await getDb();
  const doc = await db.collection("testi_sacri").findOne({ id });
  return doc ? clean<TestoSacro>(doc) : undefined;
}

export async function getLibroBySlug(slug: string): Promise<TestoSacro | undefined> {
  const db = await getDb();
  const doc = await db.collection("testi_sacri").findOne({ slug });
  return doc ? clean<TestoSacro>(doc) : undefined;
}

export async function addLibro(data: Omit<TestoSacro, "id">): Promise<TestoSacro> {
  await ensureIndexes();
  const id = await nextId("testi_sacri");
  const nuovo: TestoSacro = { ...data, id };
  const db = await getDb();
  await db.collection("testi_sacri").insertOne({ ...nuovo });
  return nuovo;
}

export async function updateLibro(id: string, data: Partial<TestoSacro>): Promise<TestoSacro | null> {
  const db = await getDb();
  const result = await db.collection("testi_sacri").findOneAndUpdate(
    { id },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ? clean<TestoSacro>(result) : null;
}

export async function deleteLibro(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("testi_sacri").deleteOne({ id });
  return result.deletedCount > 0;
}

// ============================================================
//  PREGHIERE
// ============================================================

export async function getPreghiere(): Promise<Preghiera[]> {
  await ensureIndexes();
  await seedIfEmpty("preghiere", preghiereInit);
  const db = await getDb();
  return (await db.collection("preghiere").find({}).toArray()).map((d) => clean<Preghiera>(d));
}

export async function getPreghieraById(id: string): Promise<Preghiera | undefined> {
  const db = await getDb();
  const doc = await db.collection("preghiere").findOne({ id });
  return doc ? clean<Preghiera>(doc) : undefined;
}

export async function addPreghiera(data: Omit<Preghiera, "id">): Promise<Preghiera> {
  await ensureIndexes();
  const id = await nextId("preghiere");
  const nuova: Preghiera = { ...data, id };
  const db = await getDb();
  await db.collection("preghiere").insertOne({ ...nuova });
  return nuova;
}

export async function updatePreghiera(id: string, data: Partial<Preghiera>): Promise<Preghiera | null> {
  const db = await getDb();
  const result = await db.collection("preghiere").findOneAndUpdate(
    { id },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ? clean<Preghiera>(result) : null;
}

export async function deletePreghiera(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("preghiere").deleteOne({ id });
  return result.deletedCount > 0;
}

// ============================================================
//  VIDEO E CORSI
// ============================================================

export async function getVideoCorsi(): Promise<VideoCorso[]> {
  await ensureIndexes();
  await seedIfEmpty("video_corsi", videoCorsiInit);
  const db = await getDb();
  return (await db.collection("video_corsi").find({}).toArray()).map((d) => clean<VideoCorso>(d));
}

export async function getVideoCorsoById(id: string): Promise<VideoCorso | undefined> {
  const db = await getDb();
  const doc = await db.collection("video_corsi").findOne({ id });
  return doc ? clean<VideoCorso>(doc) : undefined;
}

export async function addVideoCorso(data: Omit<VideoCorso, "id">): Promise<VideoCorso> {
  await ensureIndexes();
  const id = await nextId("video_corsi");
  const nuovo: VideoCorso = { ...data, id };
  const db = await getDb();
  await db.collection("video_corsi").insertOne({ ...nuovo });
  return nuovo;
}

export async function updateVideoCorso(id: string, data: Partial<VideoCorso>): Promise<VideoCorso | null> {
  const db = await getDb();
  const result = await db.collection("video_corsi").findOneAndUpdate(
    { id },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ? clean<VideoCorso>(result) : null;
}

export async function deleteVideoCorso(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("video_corsi").deleteOne({ id });
  return result.deletedCount > 0;
}

// ============================================================
//  EVENTI
// ============================================================

export async function getEventi(): Promise<Evento[]> {
  await ensureIndexes();
  await seedIfEmpty("eventi", eventiInit);
  const db = await getDb();
  return (await db.collection("eventi").find({}).sort({ data: 1 }).toArray()).map((d) => clean<Evento>(d));
}

export async function getEventoById(id: string): Promise<Evento | undefined> {
  const db = await getDb();
  const doc = await db.collection("eventi").findOne({ id });
  return doc ? clean<Evento>(doc) : undefined;
}

export async function getEventoBySlug(slug: string): Promise<Evento | undefined> {
  const db = await getDb();
  const doc = await db.collection("eventi").findOne({ slug });
  return doc ? clean<Evento>(doc) : undefined;
}

export async function addEvento(data: Omit<Evento, "id">): Promise<Evento> {
  await ensureIndexes();
  const id = await nextId("eventi");
  const nuovo: Evento = { ...data, id };
  const db = await getDb();
  await db.collection("eventi").insertOne({ ...nuovo });
  return nuovo;
}

export async function updateEvento(id: string, data: Partial<Evento>): Promise<Evento | null> {
  const db = await getDb();
  const result = await db.collection("eventi").findOneAndUpdate(
    { id },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ? clean<Evento>(result) : null;
}

export async function deleteEvento(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("eventi").deleteOne({ id });
  return result.deletedCount > 0;
}

// ============================================================
//  ORARI SETTIMANALI
// ============================================================

export async function getOrari(): Promise<OrarioSettimanale[]> {
  await ensureIndexes();
  await seedIfEmpty("orari_settimanali", orariInit);
  const db = await getDb();
  return (await db.collection("orari_settimanali").find({}).toArray()).map((d) =>
    clean<OrarioSettimanale>(d)
  );
}

export async function addOrario(data: OrarioSettimanale): Promise<OrarioSettimanale> {
  const db = await getDb();
  await db.collection("orari_settimanali").insertOne({ ...data });
  return data;
}

export async function updateOrario(giorno: string, data: OrarioSettimanale): Promise<OrarioSettimanale | null> {
  const db = await getDb();
  const result = await db.collection("orari_settimanali").findOneAndUpdate(
    { giorno },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ? clean<OrarioSettimanale>(result) : null;
}

export async function deleteOrario(giorno: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("orari_settimanali").deleteOne({ giorno });
  return result.deletedCount > 0;
}

// ============================================================
//  FILE PRIVATI (Libreria riservata admin)
// ============================================================

export async function getFilePrivati(): Promise<FilePrivato[]> {
  await ensureIndexes();
  const db = await getDb();
  return (await db.collection("file_privati").find({}).toArray()).map((d) => clean<FilePrivato>(d));
}

export async function getFilePrivatoById(id: string): Promise<FilePrivato | undefined> {
  const db = await getDb();
  const doc = await db.collection("file_privati").findOne({ id });
  return doc ? clean<FilePrivato>(doc) : undefined;
}

export async function addFilePrivato(data: Omit<FilePrivato, "id">): Promise<FilePrivato> {
  await ensureIndexes();
  const id = await nextId("file_privati");
  const nuovo: FilePrivato = { ...data, id };
  const db = await getDb();
  await db.collection("file_privati").insertOne({ ...nuovo });
  return nuovo;
}

export async function deleteFilePrivato(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("file_privati").deleteOne({ id });
  return result.deletedCount > 0;
}
