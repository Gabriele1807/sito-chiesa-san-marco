/**
 * Validazione runtime dei contenuti inviati dal pannello admin.
 *
 * Le route admin passavano il body JSON direttamente al database
 * (`insertOne({...body})`, `$set: body`): qualsiasi campo, di qualsiasi tipo.
 * Qui ogni entità ha una whitelist di campi con tipo e lunghezza massima;
 * i campi sconosciuti vengono scartati (nessun mass assignment), i tipi
 * sbagliati rifiutati con 400, e i campi usati come URL (link, iframe,
 * immagini) accettano solo http(s) o percorsi interni del sito.
 *
 * Stesso stile manuale del resto del progetto (nessuna libreria di schema).
 */

type FieldType =
  | "string"
  | "url"
  | "stringArray"
  | "urlArray"
  | "number"
  | "boolean"
  | "raccoglimento"
  | "celebrazioni";

interface FieldSpec {
  type: FieldType;
  required?: boolean;
  max?: number;
}

const SHORT = 300;
const TEXT = 20_000;
const LONG_TEXT = 200_000;
const MAX_ITEMS = 100;

export const CONTENT_SCHEMAS = {
  eventi: {
    slug: { type: "string", max: SHORT },
    titolo: { type: "string", required: true, max: SHORT },
    data: { type: "string", required: true, max: 64 },
    dataFine: { type: "string", max: 64 },
    descrizione: { type: "string", max: TEXT },
    luogo: { type: "string", max: SHORT },
    referente: { type: "string", max: SHORT },
    postiDisponibili: { type: "number" },
    immagine: { type: "url" },
    showRaccoglimento: { type: "boolean" },
    raccoglimento: { type: "raccoglimento" },
    paymentDeadline: { type: "string", max: 64 },
  },
  icone: {
    slug: { type: "string", max: SHORT },
    nome: { type: "string", required: true, max: SHORT },
    nomeSanto: { type: "string", max: SHORT },
    descrizione: { type: "string", max: TEXT },
    descrizioneEstesa: { type: "string", max: TEXT },
    posizione: { type: "string", max: SHORT },
    categoria: { type: "string", max: SHORT },
    immagini: { type: "urlArray" },
    tecnica: { type: "string", max: SHORT },
    autore: { type: "string", max: SHORT },
    anno: { type: "string", max: 64 },
    testiCorrelati: { type: "stringArray" },
    iconeCorrelate: { type: "stringArray" },
  },
  libreria: {
    slug: { type: "string", max: SHORT },
    titolo: { type: "string", required: true, max: SHORT },
    autore: { type: "string", max: SHORT },
    tipo: { type: "string", max: 64 },
    descrizione: { type: "string", max: TEXT },
    urlPDF: { type: "url" },
    copertina: { type: "url" },
    iconeCorrelate: { type: "stringArray" },
  },
  preghiere: {
    slug: { type: "string", max: SHORT },
    titolo: { type: "string", required: true, max: SHORT },
    descrizione: { type: "string", max: TEXT },
    urlPDF: { type: "url" },
    testoInline: { type: "string", max: LONG_TEXT },
    categoria: { type: "string", max: SHORT },
  },
  "video-corsi": {
    titolo: { type: "string", required: true, max: SHORT },
    descrizione: { type: "string", max: TEXT },
    urlVideo: { type: "url", required: true },
    categoria: { type: "string", max: SHORT },
    thumbnail: { type: "url" },
  },
  "libreria-privata": {
    nome: { type: "string", required: true, max: SHORT },
    descrizione: { type: "string", max: TEXT },
    tipo: { type: "string", max: 64 },
    url: { type: "url", required: true },
  },
  orari: {
    giorno: { type: "string", required: true, max: 32 },
    celebrazioni: { type: "celebrazioni", required: true },
  },
} satisfies Record<string, Record<string, FieldSpec>>;

export type ContentEntity = keyof typeof CONTENT_SCHEMAS;

export type ValidationResult =
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string };

/** Solo http(s) assoluti o percorsi interni ("/..."); stringa vuota ammessa. */
export function isSafeUrl(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkString(value: unknown, max = TEXT): string | null {
  return typeof value === "string" && value.length <= max ? value : null;
}

function validateField(
  name: string,
  spec: FieldSpec,
  value: unknown
): { value: unknown } | { error: string } {
  const bad = (what: string) => ({ error: `Campo "${name}" non valido: ${what}` });

  switch (spec.type) {
    case "string": {
      const s = checkString(value, spec.max);
      return s === null ? bad(`testo di massimo ${spec.max ?? TEXT} caratteri`) : { value: s };
    }
    case "url": {
      const s = checkString(value, 2048);
      if (s === null) return bad("URL di massimo 2048 caratteri");
      return isSafeUrl(s.trim())
        ? { value: s.trim() }
        : bad("solo link http(s) o percorsi del sito");
    }
    case "stringArray":
    case "urlArray": {
      if (!Array.isArray(value) || value.length > MAX_ITEMS)
        return bad(`elenco di massimo ${MAX_ITEMS} valori`);
      const out: string[] = [];
      for (const item of value) {
        const s = checkString(item, spec.type === "urlArray" ? 2048 : SHORT);
        if (s === null) return bad("elenco di testi");
        if (spec.type === "urlArray" && !isSafeUrl(s.trim()))
          return bad("solo link http(s) o percorsi del sito");
        out.push(spec.type === "urlArray" ? s.trim() : s);
      }
      return { value: out };
    }
    case "number": {
      if (value === null) return { value: undefined };
      return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000
        ? { value }
        : bad("numero non negativo");
    }
    case "boolean":
      return typeof value === "boolean" ? { value } : bad("vero/falso");
    case "raccoglimento": {
      if (!Array.isArray(value) || value.length > MAX_ITEMS)
        return bad("elenco di punti di raccolta");
      const out: { label: string; orario: string }[] = [];
      for (const item of value) {
        if (!isPlainObject(item)) return bad("elenco di punti di raccolta");
        const label = checkString(item.label, SHORT);
        const orario = checkString(item.orario, 64);
        if (label === null || orario === null)
          return bad("punto di raccolta con etichetta e orario");
        out.push({ label, orario });
      }
      return { value: out };
    }
    case "celebrazioni": {
      if (!Array.isArray(value) || value.length > MAX_ITEMS) return bad("elenco di celebrazioni");
      const out: { tipo: string; orario: string; note?: string }[] = [];
      for (const item of value) {
        if (!isPlainObject(item)) return bad("elenco di celebrazioni");
        const tipo = checkString(item.tipo, SHORT);
        const orario = checkString(item.orario, 64);
        const note = item.note === undefined ? undefined : checkString(item.note, SHORT);
        if (tipo === null || orario === null || note === null)
          return bad("celebrazione con tipo e orario");
        out.push(note === undefined ? { tipo, orario } : { tipo, orario, note });
      }
      return { value: out };
    }
  }
}

/**
 * Valida il body di una creazione (`create`, campi obbligatori richiesti) o
 * di una modifica (`update`, solo i campi presenti). Restituisce i soli
 * campi ammessi, già normalizzati; i campi sconosciuti vengono ignorati.
 */
export function validateContent(
  entity: ContentEntity,
  body: unknown,
  mode: "create" | "update"
): ValidationResult {
  if (!isPlainObject(body)) return { ok: false, error: "Dati non validi" };
  const schema: Record<string, FieldSpec> = CONTENT_SCHEMAS[entity];
  const data: Record<string, unknown> = {};

  for (const [name, spec] of Object.entries(schema)) {
    const present = Object.prototype.hasOwnProperty.call(body, name) && body[name] !== undefined;
    if (!present) {
      if (mode === "create" && spec.required)
        return { ok: false, error: `Campo "${name}" obbligatorio` };
      continue;
    }
    const result = validateField(name, spec, body[name]);
    if ("error" in result) return { ok: false, error: result.error };
    if (spec.required && typeof result.value === "string" && result.value.trim() === "") {
      return { ok: false, error: `Campo "${name}" obbligatorio` };
    }
    if (result.value !== undefined) data[name] = result.value;
  }

  return { ok: true, data };
}

/** Identificativo passato nel body/query: deve essere una stringa semplice, mai un oggetto (operatori MongoDB). */
export function parseContentId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 128 ? value : null;
}
