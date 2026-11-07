/**
 * Persistenza del calendario liturgico su MongoDB.
 *
 * Collezioni:
 * - calendario_contenuti   Sinassario, letture e note per chiave (fissa, mobile,
 *                          stagionale), in italiano e arabo, con stato bozza/pubblicato.
 *                          Indice unico su { livello, chiave }.
 * - calendario_feste       Feste fisse (mese/giorno copti), attivabili dall'admin.
 *                          Indice unico su { id }.
 * - calendario_regole      Valori impostati per le regole incerte di
 *                          src/lib/calendario/rules.ts. Indice unico su { id }.
 * - calendario_impostazioni Impostazioni generali (località predefinita).
 *                          Documento unico { id: "generale" }.
 *
 * Il calcolo del calendario NON dipende da queste collezioni: se il database
 * non risponde si usano i valori predefiniti del codice (vedi
 * src/lib/calendario-data.ts).
 *
 * ⚠️ Solo lato server.
 */

import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { getDb } from "./client";
import {
  CONTENT_LEVELS,
  READING_IDS,
  isValidContentKey,
  type ContentLevel,
  type DayContent,
  type LocalizedText,
  type ReadingId,
} from "@/lib/calendario/content";
import {
  CONFIGURABLE_RULES,
  DEFAULT_FIXED_FEASTS,
  findRule,
  type FixedFeastDef,
  type RuleId,
  type RuleSettings,
} from "@/lib/calendario/rules";
import { DEFAULT_LOCATION, type Location } from "@/lib/calendario/service";

export const COLLECTIONS = {
  contenuti: "calendario_contenuti",
  feste: "calendario_feste",
  regole: "calendario_regole",
  impostazioni: "calendario_impostazioni",
} as const;

export const CALENDARIO_SECTION_ID = "calendario";

export const STATI = ["bozza", "pubblicato"] as const;
export type StatoContenuto = (typeof STATI)[number];

interface Audit {
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CalendarioContenuto extends Audit {
  id: string;
  livello: ContentLevel;
  chiave: string;
  stato: StatoContenuto;
  sinassario?: LocalizedText;
  letture?: Partial<Record<ReadingId, LocalizedText>>;
  note?: LocalizedText;
}

export interface FestaFissa extends Audit {
  id: string;
  mese: number;
  giorno: number;
  nome: LocalizedText;
  attiva: boolean;
  origine: "predefinita" | "admin";
}

export interface RegolaImpostata extends Audit {
  id: RuleId;
  attiva: boolean;
  valore: string | null;
}

export interface ImpostazioniCalendario extends Audit {
  id: "generale";
  localita: Location;
}

// ---------------------------------------------------------------------------
// Validazione e sanificazione (pure, testabili)
// ---------------------------------------------------------------------------

export const LIMITS = { testoLungo: 40_000, nota: 5_000, nome: 160, localita: 80 } as const;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Testo semplice: rimuove i caratteri di controllo (tranne a capo e
 * tabulazione), normalizza gli a capo e taglia gli spazi. Il testo è
 * mostrato come testo, mai come HTML: React lo esegue già l'escape.
 */
export function sanitizeText(value: unknown, max: number): string | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (cleaned.length > max) return null;
  return cleaned === "" ? undefined : cleaned;
}

function localized(value: unknown, max: number, field: string): Result<LocalizedText | undefined> {
  if (value === undefined || value === null) return { ok: true, data: undefined };
  if (!isPlainObject(value)) return { ok: false, error: `Campo "${field}" non valido` };
  const out: LocalizedText = {};
  for (const lang of ["it", "ar"] as const) {
    const t = sanitizeText(value[lang], max);
    if (t === null)
      return { ok: false, error: `Campo "${field}.${lang}" non valido (massimo ${max} caratteri)` };
    if (t) out[lang] = t;
  }
  return { ok: true, data: Object.keys(out).length ? out : undefined };
}

export function parseLevel(value: unknown): ContentLevel | null {
  return CONTENT_LEVELS.includes(value as ContentLevel) ? (value as ContentLevel) : null;
}

export type ContenutoInput = Pick<
  CalendarioContenuto,
  "livello" | "chiave" | "stato" | "sinassario" | "letture" | "note"
>;

export function validateContenuto(body: unknown): Result<ContenutoInput> {
  if (!isPlainObject(body)) return { ok: false, error: "Dati non validi" };
  const livello = parseLevel(body.livello);
  if (!livello) return { ok: false, error: "Livello non valido" };
  if (!isValidContentKey(livello, body.chiave)) return { ok: false, error: "Chiave non valida" };
  const stato = body.stato ?? "bozza";
  if (!STATI.includes(stato as StatoContenuto)) return { ok: false, error: "Stato non valido" };

  const sinassario = localized(body.sinassario, LIMITS.testoLungo, "sinassario");
  if (!sinassario.ok) return sinassario;
  const note = localized(body.note, LIMITS.nota, "note");
  if (!note.ok) return note;

  let letture: ContenutoInput["letture"];
  if (body.letture !== undefined && body.letture !== null) {
    if (!isPlainObject(body.letture)) return { ok: false, error: 'Campo "letture" non valido' };
    letture = {};
    for (const id of READING_IDS) {
      const r = localized(body.letture[id], LIMITS.testoLungo, `letture.${id}`);
      if (!r.ok) return r;
      if (r.data) letture[id] = r.data;
    }
    if (Object.keys(letture).length === 0) letture = undefined;
  }

  const data: ContenutoInput = { livello, chiave: body.chiave, stato: stato as StatoContenuto };
  if (sinassario.data) data.sinassario = sinassario.data;
  if (letture) data.letture = letture;
  if (note.data) data.note = note.data;
  return { ok: true, data };
}

const FESTA_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Il Natale dipende dalla regola "natale", non è una festa fissa modificabile. */
const RESERVED_FEAST_IDS = new Set(["natale"]);

export type FestaInput = Pick<FestaFissa, "id" | "mese" | "giorno" | "nome" | "attiva">;

export function validateFesta(
  body: unknown,
  mode: "create" | "update"
): Result<Partial<FestaInput>> {
  if (!isPlainObject(body)) return { ok: false, error: "Dati non validi" };
  const data: Partial<FestaInput> = {};
  const has = (k: string) => body[k] !== undefined;

  if (mode === "create" || has("id")) {
    const id = body.id;
    if (typeof id !== "string" || id.length < 2 || id.length > 40 || !FESTA_ID.test(id))
      return { ok: false, error: "Identificativo non valido (minuscole, cifre e trattini)" };
    if (RESERVED_FEAST_IDS.has(id))
      return { ok: false, error: "Il Natale si imposta dalla regola dedicata" };
    data.id = id;
  }
  if (mode === "create" || has("mese") || has("giorno")) {
    const mese = body.mese;
    const giorno = body.giorno;
    if (!Number.isInteger(mese) || (mese as number) < 1 || (mese as number) > 13)
      return { ok: false, error: "Mese non valido" };
    const max = mese === 13 ? 6 : 30;
    if (!Number.isInteger(giorno) || (giorno as number) < 1 || (giorno as number) > max)
      return { ok: false, error: "Giorno non valido" };
    data.mese = mese as number;
    data.giorno = giorno as number;
  }
  if (mode === "create" || has("nome")) {
    const nome = localized(body.nome, LIMITS.nome, "nome");
    if (!nome.ok) return nome;
    if (!nome.data?.it) return { ok: false, error: 'Campo "nome.it" obbligatorio' };
    data.nome = nome.data;
  }
  if (mode === "create" || has("attiva")) {
    const attiva = body.attiva ?? true;
    if (typeof attiva !== "boolean") return { ok: false, error: "Campo attiva non valido" };
    data.attiva = attiva;
  }
  return { ok: true, data };
}

export type RegolaInput = Pick<RegolaImpostata, "id" | "attiva" | "valore">;

export function validateRegola(body: unknown): Result<RegolaInput> {
  if (!isPlainObject(body)) return { ok: false, error: "Dati non validi" };
  const rule = typeof body.id === "string" ? findRule(body.id) : undefined;
  if (!rule) return { ok: false, error: "Regola sconosciuta" };
  if (typeof body.attiva !== "boolean") return { ok: false, error: "Campo attiva non valido" };
  const valore = body.valore ?? null;
  if (valore !== null && (typeof valore !== "string" || !rule.options.includes(valore)))
    return { ok: false, error: "Valore non ammesso per questa regola" };
  if (body.attiva && !rule.implemented)
    return { ok: false, error: "Regola non ancora implementata: non può essere attivata" };
  if (body.attiva && valore === null)
    return { ok: false, error: "Scegli un valore prima di attivare la regola" };
  return { ok: true, data: { id: rule.id, attiva: body.attiva, valore } };
}

export function validateImpostazioni(body: unknown): Result<{ localita: Location }> {
  if (!isPlainObject(body) || !isPlainObject(body.localita))
    return { ok: false, error: "Dati non validi" };
  const { name: rawName, lat, lon } = body.localita;
  const name = sanitizeText(rawName, LIMITS.localita);
  if (!name) return { ok: false, error: "Nome della località non valido" };
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90)
    return { ok: false, error: "Latitudine non valida" };
  if (typeof lon !== "number" || !Number.isFinite(lon) || lon < -180 || lon > 180)
    return { ok: false, error: "Longitudine non valida" };
  return { ok: true, data: { localita: { name, lat, lon } } };
}

// ---------------------------------------------------------------------------
// Accesso ai dati
// ---------------------------------------------------------------------------

async function col(name: string) {
  return (await getDb()).collection(name);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T>(doc: any): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as T;
}

const g = globalThis as unknown as { _calendarioIndexes?: boolean };

export async function ensureCalendarioIndexes(db?: Db): Promise<void> {
  if (g._calendarioIndexes) return;
  const d = db ?? (await getDb());
  await Promise.all([
    d.collection(COLLECTIONS.contenuti).createIndex({ livello: 1, chiave: 1 }, { unique: true }),
    d.collection(COLLECTIONS.contenuti).createIndex({ id: 1 }, { unique: true }),
    d.collection(COLLECTIONS.contenuti).createIndex({ stato: 1, livello: 1, chiave: 1 }),
    d.collection(COLLECTIONS.feste).createIndex({ id: 1 }, { unique: true }),
    d.collection(COLLECTIONS.feste).createIndex({ mese: 1, giorno: 1 }),
    d.collection(COLLECTIONS.regole).createIndex({ id: 1 }, { unique: true }),
    d.collection(COLLECTIONS.impostazioni).createIndex({ id: 1 }, { unique: true }),
  ]);
  g._calendarioIndexes = true;
}

/** Solo per i test. */
export function resetCalendarioIndexFlag() {
  g._calendarioIndexes = false;
}

function toDayContent(doc: CalendarioContenuto): DayContent {
  const out: DayContent = { level: doc.livello, key: doc.chiave };
  if (doc.sinassario) out.sinassario = doc.sinassario;
  if (doc.letture) out.letture = doc.letture;
  if (doc.note) out.note = doc.note;
  return out;
}

/** Lettura pubblica: SOLO contenuti pubblicati, senza campi di audit. */
export async function getPublishedContent(
  livello: ContentLevel,
  chiave: string
): Promise<DayContent | null> {
  if (!isValidContentKey(livello, chiave)) return null;
  const c = await col(COLLECTIONS.contenuti);
  const doc = await c.findOne({ livello, chiave, stato: "pubblicato" });
  return doc ? toDayContent(clean<CalendarioContenuto>(doc)) : null;
}

export async function getContenuto(
  livello: ContentLevel,
  chiave: string
): Promise<CalendarioContenuto | null> {
  const c = await col(COLLECTIONS.contenuti);
  const doc = await c.findOne({ livello, chiave });
  return doc ? clean<CalendarioContenuto>(doc) : null;
}

/** Elenco per il pannello admin (eventualmente filtrato per livello o chiavi). */
export async function listContenuti(
  filter: { livello?: ContentLevel; chiavi?: string[] } = {}
): Promise<CalendarioContenuto[]> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.contenuti);
  const query: Record<string, unknown> = {};
  if (filter.livello) query.livello = filter.livello;
  if (filter.chiavi) query.chiave = { $in: filter.chiavi.slice(0, 50) };
  const docs = await c.find(query).sort({ livello: 1, chiave: 1 }).limit(1000).toArray();
  return docs.map((d) => clean<CalendarioContenuto>(d));
}

export async function upsertContenuto(
  input: ContenutoInput,
  updatedBy: string
): Promise<CalendarioContenuto> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.contenuti);
  const now = new Date().toISOString();
  const $set: Record<string, unknown> = {
    stato: input.stato,
    sinassario: input.sinassario ?? null,
    letture: input.letture ?? null,
    note: input.note ?? null,
    updatedAt: now,
    updatedBy,
  };
  await c.updateOne(
    { livello: input.livello, chiave: input.chiave },
    {
      $set,
      $setOnInsert: {
        id: randomUUID(),
        livello: input.livello,
        chiave: input.chiave,
        createdAt: now,
      },
    },
    { upsert: true }
  );
  const saved = await getContenuto(input.livello, input.chiave);
  if (!saved) throw new Error("Contenuto non salvato");
  return dropNulls(saved);
}

function dropNulls<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null)) as T;
}

export async function deleteContenuto(livello: ContentLevel, chiave: string): Promise<boolean> {
  const c = await col(COLLECTIONS.contenuti);
  const res = await c.deleteOne({ livello, chiave });
  return res.deletedCount > 0;
}

// --- Feste ---

export async function listFeste(): Promise<FestaFissa[]> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.feste);
  const docs = await c.find({}).sort({ mese: 1, giorno: 1 }).limit(500).toArray();
  return docs.map((d) => clean<FestaFissa>(d));
}

export async function createFesta(
  input: FestaInput,
  updatedBy: string
): Promise<FestaFissa | null> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.feste);
  if (await c.findOne({ id: input.id })) return null;
  const now = new Date().toISOString();
  const festa: FestaFissa = {
    ...input,
    origine: "admin",
    createdAt: now,
    updatedAt: now,
    updatedBy,
  };
  await c.insertOne({ ...festa });
  return festa;
}

export async function updateFesta(
  id: string,
  data: Partial<Omit<FestaInput, "id">>,
  updatedBy: string
): Promise<FestaFissa | null> {
  const c = await col(COLLECTIONS.feste);
  const doc = await c.findOneAndUpdate(
    { id },
    { $set: { ...data, updatedAt: new Date().toISOString(), updatedBy } },
    { returnDocument: "after" }
  );
  return doc ? clean<FestaFissa>(doc) : null;
}

export async function deleteFesta(id: string): Promise<boolean> {
  const c = await col(COLLECTIONS.feste);
  const res = await c.deleteOne({ id });
  return res.deletedCount > 0;
}

// --- Regole ---

export interface RegolaView {
  id: RuleId;
  options: readonly string[];
  implemented: boolean;
  attiva: boolean;
  valore: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

/** Catalogo delle regole unito ai valori salvati. */
export async function listRegole(): Promise<RegolaView[]> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.regole);
  const docs = (await c.find({}).limit(100).toArray()).map((d) => clean<RegolaImpostata>(d));
  return CONFIGURABLE_RULES.map((rule) => {
    const saved = docs.find((d) => d.id === rule.id);
    return {
      id: rule.id,
      options: rule.options,
      implemented: rule.implemented,
      attiva: saved?.attiva ?? false,
      valore: saved?.valore ?? null,
      updatedAt: saved?.updatedAt,
      updatedBy: saved?.updatedBy,
    };
  });
}

export async function setRegola(input: RegolaInput, updatedBy: string): Promise<RegolaView> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.regole);
  const now = new Date().toISOString();
  await c.updateOne(
    { id: input.id },
    {
      $set: { attiva: input.attiva, valore: input.valore, updatedAt: now, updatedBy },
      $setOnInsert: { id: input.id, createdAt: now },
    },
    { upsert: true }
  );
  const all = await listRegole();
  return all.find((r) => r.id === input.id)!;
}

// --- Impostazioni ---

export async function getImpostazioni(): Promise<ImpostazioniCalendario | null> {
  const c = await col(COLLECTIONS.impostazioni);
  const doc = await c.findOne({ id: "generale" });
  return doc ? clean<ImpostazioniCalendario>(doc) : null;
}

export async function setImpostazioni(
  data: { localita: Location },
  updatedBy: string
): Promise<ImpostazioniCalendario> {
  await ensureCalendarioIndexes();
  const c = await col(COLLECTIONS.impostazioni);
  const now = new Date().toISOString();
  await c.updateOne(
    { id: "generale" },
    {
      $set: { localita: data.localita, updatedAt: now, updatedBy },
      $setOnInsert: { id: "generale", createdAt: now },
    },
    { upsert: true }
  );
  return (await getImpostazioni())!;
}

// --- Configurazione pubblica ---

export interface PublicCalendarConfig {
  feasts: FixedFeastDef[];
  rules: RuleSettings;
  location: Location;
}

export const DEFAULT_PUBLIC_CONFIG: PublicCalendarConfig = {
  feasts: [...DEFAULT_FIXED_FEASTS],
  rules: {},
  location: DEFAULT_LOCATION,
};

/** Feste attive, regole impostate e località predefinita, letti dal database. */
export async function readPublicCalendarConfig(): Promise<PublicCalendarConfig> {
  const db = await getDb();
  const [feste, regole, impostazioni] = await Promise.all([
    db.collection(COLLECTIONS.feste).find({}).limit(500).toArray(),
    db.collection(COLLECTIONS.regole).find({}).limit(100).toArray(),
    db.collection(COLLECTIONS.impostazioni).findOne({ id: "generale" }),
  ]);
  const feasts: FixedFeastDef[] =
    feste.length === 0
      ? [...DEFAULT_FIXED_FEASTS] // collezione mai inizializzata: valori del codice
      : feste
          .map((d) => clean<FestaFissa>(d))
          .filter((f) => f.attiva)
          .map((f) => ({ id: f.id, month: f.mese, day: f.giorno, name: f.nome }));
  const rules: RuleSettings = {};
  for (const r of regole.map((d) => clean<RegolaImpostata>(d))) {
    if (findRule(r.id)) rules[r.id] = { enabled: r.attiva, value: r.valore };
  }
  const loc = impostazioni ? clean<ImpostazioniCalendario>(impostazioni).localita : null;
  return { feasts, rules, location: loc ?? DEFAULT_LOCATION };
}

// ---------------------------------------------------------------------------
// Seed idempotente
// ---------------------------------------------------------------------------

/** Validatori $jsonSchema applicati dal seed (difesa in profondità oltre alla validazione in codice). */
const localizedSchema = {
  bsonType: ["object", "null"],
  additionalProperties: false,
  properties: { it: { bsonType: "string" }, ar: { bsonType: "string" } },
};

export const JSON_SCHEMAS: Record<string, object> = {
  [COLLECTIONS.contenuti]: {
    bsonType: "object",
    required: ["id", "livello", "chiave", "stato", "createdAt", "updatedAt", "updatedBy"],
    properties: {
      livello: { enum: [...CONTENT_LEVELS] },
      chiave: { bsonType: "string", maxLength: 16 },
      stato: { enum: [...STATI] },
      sinassario: localizedSchema,
      note: localizedSchema,
      letture: {
        bsonType: ["object", "null"],
        additionalProperties: false,
        properties: Object.fromEntries(READING_IDS.map((id) => [id, localizedSchema])),
      },
    },
  },
  [COLLECTIONS.feste]: {
    bsonType: "object",
    required: ["id", "mese", "giorno", "nome", "attiva", "createdAt", "updatedAt", "updatedBy"],
    properties: {
      mese: { bsonType: "int", minimum: 1, maximum: 13 },
      giorno: { bsonType: "int", minimum: 1, maximum: 30 },
      attiva: { bsonType: "bool" },
    },
  },
  [COLLECTIONS.regole]: {
    bsonType: "object",
    required: ["id", "attiva", "createdAt", "updatedAt", "updatedBy"],
    properties: {
      id: { enum: CONFIGURABLE_RULES.map((r) => r.id) },
      attiva: { bsonType: "bool" },
      valore: { bsonType: ["string", "null"] },
    },
  },
  [COLLECTIONS.impostazioni]: {
    bsonType: "object",
    required: ["id", "localita", "createdAt", "updatedAt", "updatedBy"],
  },
};

export interface SeedReport {
  inserted: Record<string, number>;
}

const SEED_ACTOR = "seed";

/**
 * Inserisce feste certe, regole (disattivate), impostazioni predefinite e
 * la sezione di visibilità "calendario". Usa solo `$setOnInsert`:
 * rieseguirlo non crea duplicati e non sovrascrive le modifiche dell'admin.
 */
export async function seedCalendario(db: Db): Promise<SeedReport> {
  await ensureCalendarioIndexes(db);
  const now = new Date().toISOString();
  const inserted: Record<string, number> = {};
  const count = (name: string, upserted: number) => {
    inserted[name] = (inserted[name] ?? 0) + upserted;
  };

  for (const f of DEFAULT_FIXED_FEASTS) {
    const res = await db.collection(COLLECTIONS.feste).updateOne(
      { id: f.id },
      {
        $setOnInsert: {
          id: f.id,
          mese: f.month,
          giorno: f.day,
          nome: f.name,
          attiva: true,
          origine: "predefinita",
          createdAt: now,
          updatedAt: now,
          updatedBy: SEED_ACTOR,
        },
      },
      { upsert: true }
    );
    count(COLLECTIONS.feste, res.upsertedCount);
  }

  for (const r of CONFIGURABLE_RULES) {
    const res = await db.collection(COLLECTIONS.regole).updateOne(
      { id: r.id },
      {
        $setOnInsert: {
          id: r.id,
          attiva: r.defaultEnabled,
          valore: null,
          createdAt: now,
          updatedAt: now,
          updatedBy: SEED_ACTOR,
        },
      },
      { upsert: true }
    );
    count(COLLECTIONS.regole, res.upsertedCount);
  }

  const imp = await db.collection(COLLECTIONS.impostazioni).updateOne(
    { id: "generale" },
    {
      $setOnInsert: {
        id: "generale",
        localita: DEFAULT_LOCATION,
        createdAt: now,
        updatedAt: now,
        updatedBy: SEED_ACTOR,
      },
    },
    { upsert: true }
  );
  count(COLLECTIONS.impostazioni, imp.upsertedCount);

  const vis = await db.collection("section_visibility").updateOne(
    { sectionId: CALENDARIO_SECTION_ID },
    {
      $setOnInsert: {
        id: CALENDARIO_SECTION_ID,
        sectionId: CALENDARIO_SECTION_ID,
        sectionLabel: "Calendario copto",
        isActive: true,
        roleConfig: {
          guest: "full",
          credente: "full",
          madre: "full",
          padre: "full",
          ospite_chiesa: "full",
          prete: "full",
          admin: "full",
          superadmin: "full",
        },
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  count("section_visibility", vis.upsertedCount);

  return { inserted };
}

/** Applica i validatori $jsonSchema (crea la collezione se manca). */
export async function applySchemaValidators(db: Db): Promise<void> {
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
  );
  for (const [name, schema] of Object.entries(JSON_SCHEMAS)) {
    const options = { validator: { $jsonSchema: schema }, validationLevel: "moderate" as const };
    if (existing.has(name)) await db.command({ collMod: name, ...options });
    else await db.createCollection(name, options);
  }
}

const seedFlag = globalThis as unknown as { _calendarioSeeded?: Promise<void> };

/** Seed pigro, una volta per istanza: il pannello admin trova sempre feste e regole. */
export function ensureCalendarioSeeded(): Promise<void> {
  if (!seedFlag._calendarioSeeded) {
    seedFlag._calendarioSeeded = getDb()
      .then((db) => seedCalendario(db))
      .then(() => undefined)
      .catch((err) => {
        seedFlag._calendarioSeeded = undefined;
        throw err;
      });
  }
  return seedFlag._calendarioSeeded;
}
