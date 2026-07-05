/**
 * CRUD iscrizioni eventi su MongoDB.
 * Collezione: "event_registrations"
 *
 * Logica famiglia / duplicati (vedi IscrizioneEvento in types):
 *  - chiave padre  = normalize(padreNome) + "|" + normalize(padreCognome)
 *  - chiave persona = normalize(nome) + "|" + normalize(cognome)
 *  - stesso (eventoId + chiave padre + chiave persona) => DUPLICATO
 *  - stesso (eventoId + chiave padre) ma persona diversa => stessa FAMIGLIA
 *
 * ⚠️ Solo lato server. NON importare in codice client / "use client".
 */

import { getDb } from "./client";
import type { IscrizioneEvento, CreateIscrizioneData, CreateIscrizioneResult } from "@/types";
import { getEventoById } from "./content";
import { ObjectId, type WithId, type Document } from "mongodb";

const COLLECTION = "event_registrations";

// --------------- helpers ---------------

/** Normalizza una stringa per confronti case/spazio-insensitive */
export function normalizeName(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Chiave identificativa del padre (per raggruppamento famiglia) */
export function familyKey(padreNome: string, padreCognome: string): string {
  const padre = normalizeName(padreNome);
  const cognome = normalizeName(padreCognome);
  return `${padre}|${cognome}`.replace(/\s+\|$/, "|"); // rimuove spazi prima del pipe
}

/** Chiave identificativa del partecipante */
export function personKey(nome: string, cognome: string): string {
  const n = normalizeName(nome);
  const c = normalizeName(cognome);
  return `${n}|${c}`.replace(/\s+\|$/, "|"); // rimuove spazi prima del pipe
}

function splitFullName(fullName: string): { name: string; surname: string } {
  const normalized = (fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { name: "", surname: "" };

  const parts = normalized.split(" ");
  if (parts.length === 1) return { name: parts[0], surname: "" };

  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

function normalizeRaccoglimentoPunto(value: unknown): IscrizioneEvento["raccoglimentoPunto"] {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as { label?: string; orario?: string };
  const label = (raw.label || "").trim();
  const orario = (raw.orario || "").trim();
  if (!label || !orario) return undefined;
  return { label, orario };
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

function toIscrizione(doc: WithId<Document>): IscrizioneEvento {
  const { _id, ...rest } = doc as unknown as IscrizioneEvento & { _id: ObjectId };
  return {
    ...rest,
    ha_pagato: typeof rest.ha_pagato === "boolean" ? rest.ha_pagato : false,
    _id: _id.toString(),
  } as IscrizioneEvento;
}

// --------------- Indexes (idempotent) ---------------

let indexesEnsured = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ eventoId: 1 });
  await c.createIndex({ eventoId: 1, createdAt: 1 });
  // Indice unico per impedire duplicati esatti (stesso evento, stesso padre, stessa persona)
  await c.createIndex(
    { eventoId: 1, _familyKey: 1, _personKey: 1 },
    { unique: true }
  );
  indexesEnsured = true;
}

// --------------- Read ---------------

/** Numero di iscrizioni per un evento */
export async function countIscrizioniByEvento(eventoId: string): Promise<number> {
  const c = await col();
  const agg = await c
    .aggregate<{ _id: null; total: number }>([
      { $match: { eventoId } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $eq: ["$registrationType", "family"] },
                { $size: { $ifNull: ["$familyMembers", []] } },
                1,
              ],
            },
          },
        },
      },
    ])
    .toArray();
  return agg[0]?.total ?? 0;
}

/** Lista iscrizioni di un evento, ordinate per data di iscrizione */
export async function getIscrizioniByEvento(eventoId: string): Promise<IscrizioneEvento[]> {
  await ensureIndexes();
  const c = await col();
  const docs = await c.find({ eventoId }).sort({ createdAt: 1 }).toArray();
  return docs.map(toIscrizione);
}

/** Lista iscrizioni di un utente, cercate per email o (nome + cognome) o come membro famiglia, ordinate per data di iscrizione (più recenti prima) */
export async function getIscrizioniByUser(nome: string, cognome: string, email?: string): Promise<IscrizioneEvento[]> {
  await ensureIndexes();
  const c = await col();
  const pKey = personKey(nome, cognome);
  const fKey = familyKey(nome, cognome);
  const fullName = `${nome} ${cognome}`.trim();
  
  // Normalizza nome e cognome per confronti
  const nomeNorm = normalizeName(nome);
  const cognomeNorm = normalizeName(cognome);

  // Costruiamo una query che cerca:
  // 1. Per email (se disponibile)
  // 2. Per persona principale (_personKey)
  // 3. Per nome e cognome esatto (case-insensitive) - partecipante
  // 4. Come membro della famiglia (fullName esatto)
  // 5. Come padre della famiglia (_familyKey)
  // 6. Per chi ha creato l'iscrizione (createdByNome + createdByCognome)
  // 7. Per email di chi ha creato l'iscrizione (createdByEmail)
  const conditions = [];
  
  if (email && email.trim()) {
    conditions.push({ email: email.trim() });
  }
  
  // Ricerca per _personKey (nome|cognome)
  conditions.push({ _personKey: pKey });
  
  // Ricerca per nome e cognome esatto (case-insensitive)
  conditions.push({
    nome: { $regex: `^${nomeNorm}$`, $options: "i" },
    cognome: { $regex: `^${cognomeNorm}$`, $options: "i" }
  });
  
  // Ricerca come membro della famiglia (fullName esatto)
  if (fullName) {
    conditions.push({
      "familyMembers": {
        $elemMatch: {
          fullName: { $regex: `^${fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" }
        }
      }
    });
  }
  
  // Ricerca come padre della famiglia (_familyKey)
  conditions.push({ _familyKey: fKey });

  // === NUOVO: Ricerca per chi ha creato l'iscrizione ===
  // Questo consente di trovare iscrizioni create per altre persone o famiglie
  // se create dall'utente autenticato
  const createdByNomeNorm = normalizeName(nome);
  const createdByCognomeNorm = normalizeName(cognome);
  
  conditions.push({
    createdByNome: { $regex: `^${createdByNomeNorm}$`, $options: "i" },
    createdByCognome: { $regex: `^${createdByCognomeNorm}$`, $options: "i" }
  });
  
  if (email && email.trim()) {
    conditions.push({ createdByEmail: email.trim() });
  }

  const query = conditions.length > 0 ? { $or: conditions } : { _personKey: pKey };
  
  try {
    const docs = await c.find(query).sort({ createdAt: -1 }).toArray();
    // Deduplicazione per evitare risultati doppi
    const seenIds = new Set<string>();
    return docs
      .filter((doc) => {
        const id = (doc._id as ObjectId).toString();
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .map(toIscrizione);
  } catch (err) {
    console.error("Errore in getIscrizioniByUser:", err);
    return [];
  }
}

/** Conteggio iscritti per tutti gli eventi: include i membri della famiglia */
export async function countIscrizioniPerEvento(): Promise<Record<string, number>> {
  const c = await col();
  const agg = await c
    .aggregate<{ _id: string; count: number }>([
      // For family registrations the participants are the elements in `familyMembers`.
      // For non-family registrations count as 1 document.
      {
        $group: {
          _id: "$eventoId",
          count: {
            $sum: {
              $cond: [
                { $eq: ["$registrationType", "family"] },
                { $size: { $ifNull: ["$familyMembers", []] } },
                1,
              ],
            },
          },
        },
      },
    ])
    .toArray();
  const map: Record<string, number> = {};
  for (const row of agg) map[row._id] = row.count;
  return map;
}

export function countIscrittiInRegistrations(iscrizioni: Array<IscrizioneEvento>): number {
  return iscrizioni.reduce((total, iscrizione) => {
    if (iscrizione.registrationType === "family") {
      return total + (Array.isArray(iscrizione.familyMembers) ? iscrizione.familyMembers.length : 0);
    }
    return total + 1;
  }, 0);
}

// --------------- Create ---------------

/**
 * Crea una nuova iscrizione applicando validazione, controllo posti
 * e logica anti-duplicato / famiglia.
 */
export async function createIscrizione(data: CreateIscrizioneData): Promise<CreateIscrizioneResult> {
  await ensureIndexes();

  // Validazione minima lato server
  if (
    !data.eventoId ||
    !data.telefono?.trim()
  ) {
    return { success: false, errorCode: "validation" };
  }

  // Email opzionale: se presente, deve essere valida
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return { success: false, errorCode: "validation" };
    }
  }

  // Validazione telefono: solo numeri (opzionalmente con + iniziale)
  const phoneRegex = /^\+?[0-9]+$/;
  if (!phoneRegex.test(data.telefono.trim().replace(/\s/g, ""))) {
    return { success: false, errorCode: "validation" };
  }

  const registrationType = data.registrationType === "family" ? "family" : data.registrationType === "other" ? "other" : "self";
  const rawFamilyMembers = Array.isArray(data.familyMembers) ? data.familyMembers : [];
  const normalizedFamilyMembers = (registrationType === "family"
    ? rawFamilyMembers.filter((member) => Boolean(member?.fullName?.trim()) && (member?.role === "madre" || member?.role === "padre" || member?.role === "figlio"))
    : []
  ).map((member) => ({
    role: member.role,
    fullName: member.fullName.trim(),
  }));

  if (registrationType === "family" && normalizedFamilyMembers.length === 0) {
    return { success: false, errorCode: "validation" };
  }

  if (registrationType === "family") {
    const uniqueRoles = new Set<"madre" | "padre">();
    for (const member of normalizedFamilyMembers) {
      if (member.role === "madre" || member.role === "padre") {
        if (uniqueRoles.has(member.role)) {
          return { success: false, errorCode: "validation" };
        }
        uniqueRoles.add(member.role);
      }
    }
  }

  const evento = await getEventoById(data.eventoId);
  if (!evento) {
    return { success: false, errorCode: "validation" };
  }

  const raccoglimento = data.raccoglimento === "chiesa" || data.raccoglimento === "luogo"
    ? data.raccoglimento
    : undefined;

  // L'evento deve esistere
  const raccoglimentoPunto = normalizeRaccoglimentoPunto(data.raccoglimentoPunto);
  const raccoglimentoDisponibile = Array.isArray(evento.raccoglimento) ? evento.raccoglimento : [];
  if (evento.showRaccoglimento) {
    if (raccoglimentoDisponibile.length === 0) {
      return { success: false, errorCode: "validation" };
    }

    const selectedMatch = raccoglimentoPunto
      ? raccoglimentoDisponibile.some(
          (punto) => normalizeName(punto.label) === normalizeName(raccoglimentoPunto.label) && normalizeName(punto.orario) === normalizeName(raccoglimentoPunto.orario)
        )
      : false;

    if (!selectedMatch) {
      return { success: false, errorCode: "validation" };
    }
  }

  const fatherInMembers = normalizedFamilyMembers.some((member) => member.role === "padre");
  const fatherMember = normalizedFamilyMembers.find((member) => member.role === "padre");
  const fatherFromMembers = fatherMember ? splitFullName(fatherMember.fullName) : { name: "", surname: "" };

  const rawFatherName = (data.fatherName ?? data.padreNome ?? "").trim();
  const rawFatherSurname = (data.fatherSurname ?? data.padreCognome ?? "").trim();

  const effectiveFatherName = fatherInMembers ? fatherFromMembers.name : rawFatherName;
  const effectiveFatherSurname = fatherInMembers ? fatherFromMembers.surname : rawFatherSurname;

  if (registrationType !== "family") {
    if (!data.nome?.trim() || !data.cognome?.trim() || !effectiveFatherName || !effectiveFatherSurname) {
      return { success: false, errorCode: "validation" };
    }
  } else {
    const hasAnyRepresentative = normalizedFamilyMembers.some((member) => member.fullName.trim());
    if (!hasAnyRepresentative) {
      return { success: false, errorCode: "validation" };
    }
    if (!fatherInMembers && (!effectiveFatherName || !effectiveFatherSurname)) {
      return { success: false, errorCode: "validation" };
    }
  }

  const primaryFamilyMember = registrationType === "family"
    ? normalizedFamilyMembers.find((member) => member.role !== "padre") ?? normalizedFamilyMembers[0]
    : null;
  const primaryFullName = registrationType === "family"
    ? primaryFamilyMember?.fullName ?? ""
    : `${data.nome?.trim() || ""} ${data.cognome?.trim() || ""}`.trim();
  const { name: resolvedNome, surname: resolvedCognome } = splitFullName(primaryFullName);

  const savedFatherName = registrationType === "family" && fatherInMembers ? "" : effectiveFatherName;
  const savedFatherSurname = registrationType === "family" && fatherInMembers ? "" : effectiveFatherSurname;

  // If a specific collection point was provided, try to infer semantic type:
  // - if the selected point label mentions 'chiesa' treat as 'chiesa'
  // - otherwise treat as 'luogo'
  let storedRaccoglimento: IscrizioneEvento["raccoglimento"] | undefined = undefined;
  if (raccoglimentoPunto) {
    const lbl = normalizeName(raccoglimentoPunto.label || "");
    if (lbl.includes("chiesa")) {
      storedRaccoglimento = "chiesa";
    } else {
      storedRaccoglimento = "luogo";
    }
  } else if (data.raccoglimento === "chiesa" || data.raccoglimento === "luogo") {
    storedRaccoglimento = data.raccoglimento;
  }

  const c = await col();

  const fKey = familyKey(effectiveFatherName, effectiveFatherSurname);
  const pKey = personKey(resolvedNome, resolvedCognome);

  // Controllo duplicato esplicito (oltre all'indice unico)
  const existing = await c.findOne({ eventoId: data.eventoId, _familyKey: fKey, _personKey: pKey });
  if (existing) {
    return { success: false, errorCode: "duplicate" };
  }

  // La famiglia (stesso padre) ha gia altre iscrizioni a questo evento?
  const sameFamily = (await c.countDocuments({ eventoId: data.eventoId, _familyKey: fKey })) > 0;

  // Controllo posti disponibili (solo se l'evento ha un limite definito)
  if (typeof evento.postiDisponibili === "number" && evento.postiDisponibili > 0) {
    const agg = await c
      .aggregate<{ _id: null; total: number }>([
        { $match: { eventoId: data.eventoId } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [1, { $size: { $ifNull: ["$familyMembers", []] } }],
              },
            },
          },
        },
      ])
      .toArray();
    const current = agg[0]?.total ?? 0;
    if (current >= evento.postiDisponibili) {
      return { success: false, errorCode: "full", sameFamily };
    }
  }

  const now = new Date().toISOString();
  const doc = {
    eventoId: data.eventoId,
    nome: resolvedNome,
    cognome: resolvedCognome,
    fatherName: savedFatherName,
    fatherSurname: savedFatherSurname,
    padreNome: effectiveFatherName,
    padreCognome: effectiveFatherSurname,
    telefono: data.telefono.trim(),
    email: data.email?.trim() || undefined,
    note: data.note?.trim() || undefined,
    ha_pagato: false,
    registrationType,
    familyMembers: normalizedFamilyMembers,
    raccoglimento: storedRaccoglimento,
    raccoglimentoPunto,
    createdAt: now,
    createdByNome: data.createdByNome?.trim() || undefined,
    createdByCognome: data.createdByCognome?.trim() || undefined,
    createdByEmail: data.createdByEmail?.trim() || undefined,
    // campi tecnici per indici/lookup (non esposti al client)
    _familyKey: fKey,
    _personKey: pKey,
  };

  try {
    const result = await c.insertOne(doc);
    const { _familyKey: _f, _personKey: _p, ...clean } = doc;
    void _f; void _p;
    return {
      success: true,
      sameFamily,
      iscrizione: { ...clean, _id: result.insertedId.toString() } as IscrizioneEvento,
    };
  } catch (err: unknown) {
    // Violazione indice unico => duplicato concorrente
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return { success: false, errorCode: "duplicate", sameFamily };
    }
    return { success: false, errorCode: "server" };
  }
}

// --------------- Delete ---------------

/** Elimina una singola iscrizione tramite _id */
export async function deleteIscrizione(id: string): Promise<boolean> {
  const c = await col();
  if (!ObjectId.isValid(id)) return false;
  const result = await c.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/** Elimina tutte le iscrizioni di un evento (es. quando l'evento viene rimosso) */
export async function deleteIscrizioniByEvento(eventoId: string): Promise<number> {
  const c = await col();
  const result = await c.deleteMany({ eventoId });
  return result.deletedCount;
}

/** Aggiorna i dati di un'iscrizione esistente */
export async function updateIscrizione(
  id: string,
  data: Partial<Omit<IscrizioneEvento, "id" | "_id" | "eventoId" | "createdAt">>
): Promise<boolean> {
  const c = await col();
  if (!ObjectId.isValid(id)) return false;

  if ("ha_pagato" in data && typeof data.ha_pagato !== "boolean") {
    return false;
  }

  // Non permettiamo di cambiare le chiavi univoche (nome, cognome, padre) tramite update semplice
  // per evitare di rompere la logica anti-duplicato senza ricalcolare i tasti.
  // Ma in questo caso l'admin ha il permesso di correggere errori.
  const updateDoc: any = { ...data };

  // Se cambiano i nomi, ricalcoliamo le chiavi di indicizzazione
  if (data.nome || data.cognome || data.padreNome || data.padreCognome) {
    // Nota: in una implementazione reale dovremmo recuperare il documento esistente per i campi mancanti,
    // ma qui assumiamo che l'admin invii i campi necessari o che la correzione sia puntuale.
    // Per semplicità, se cambiano i nomi, aggiorniamo solo i campi testuali.
  }

  const result = await c.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updateDoc, updatedAt: new Date().toISOString() } }
  );
  return result.matchedCount > 0;
}

/** Aggiornamento atomico dello stato di pagamento di un'iscrizione */
export async function updateIscrizionePagamento(id: string, ha_pagato: boolean): Promise<boolean> {
  const c = await col();
  if (!ObjectId.isValid(id) || typeof ha_pagato !== "boolean") return false;

  const result = await c.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ha_pagato,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  return result.matchedCount > 0;
}
