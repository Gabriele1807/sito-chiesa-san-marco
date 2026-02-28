/**
 * In-memory data store — funge da "database" condiviso tra area admin e parte pubblica.
 *
 * FUTURO: Sostituire questo file con chiamate a Supabase.
 * Ogni funzione get/add/update/delete può essere rimpiazzata con:
 *   - supabase.from('tabella').select('*')
 *   - supabase.from('tabella').insert(...)
 *   - supabase.from('tabella').update(...).eq('id', id)
 *   - supabase.from('tabella').delete().eq('id', id)
 */

import type {
  Icona,
  TestoSacro,
  Preghiera,
  Evento,
  OrarioSettimanale,
} from "@/types";
import {
  icone as iconeInit,
  testiSacri as testiSacriInit,
  preghiere as preghiereInit,
  eventi as eventiInit,
  orariSettimanali as orariInit,
} from "@/lib/mock-data";

// === Tipo per i file privati admin ===
export interface FilePrivato {
  id: string;
  nome: string;
  descrizione: string;
  tipo: string; // "PDF", "Immagine", "Altro"
  url: string;
  dataCaricamento: string; // ISO date
}

// ====================================================================
// Store mutabili — uso globalThis per condividere lo stato tra
// API routes e server components (Turbopack può ri-valutare i moduli)
// FUTURO: eliminare queste variabili e leggere direttamente da Supabase
// ====================================================================
interface StoreData {
  libri: TestoSacro[];
  icone: Icona[];
  preghiere: Preghiera[];
  eventi: Evento[];
  orari: OrarioSettimanale[];
  filePrivati: FilePrivato[];
}

const globalForStore = globalThis as unknown as { __store?: StoreData };

if (!globalForStore.__store) {
  globalForStore.__store = {
    libri: [...testiSacriInit],
    icone: [...iconeInit],
    preghiere: [...preghiereInit],
    eventi: [...eventiInit],
    orari: [...orariInit],
    filePrivati: [],
  };
}

const store = globalForStore.__store;

// Helper per generare ID semplici (FUTURO: usare UUID o ID auto-generati dal DB)
function nextId(arr: { id: string }[]): string {
  const max = arr.reduce((m, item) => Math.max(m, parseInt(item.id) || 0), 0);
  return String(max + 1);
}

// ======================== LIBRI (TestoSacro) ========================
// FUTURO: supabase.from('testi_sacri')...
export function getLibri(): TestoSacro[] {
  return store.libri;
}
export function getLibroById(id: string): TestoSacro | undefined {
  return store.libri.find((l) => l.id === id);
}
export function getLibroBySlug(slug: string): TestoSacro | undefined {
  return store.libri.find((l) => l.slug === slug);
}
export function addLibro(data: Omit<TestoSacro, "id">): TestoSacro {
  const nuovo: TestoSacro = { ...data, id: nextId(store.libri) };
  store.libri.push(nuovo);
  return nuovo;
}
export function updateLibro(id: string, data: Partial<TestoSacro>): TestoSacro | null {
  const idx = store.libri.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  store.libri[idx] = { ...store.libri[idx], ...data, id };
  return store.libri[idx];
}
export function deleteLibro(id: string): boolean {
  const len = store.libri.length;
  store.libri = store.libri.filter((l) => l.id !== id);
  return store.libri.length < len;
}

// ======================== ICONE ========================
// FUTURO: supabase.from('icone')...
export function getIcone(): Icona[] {
  return store.icone;
}
export function getIconaById(id: string): Icona | undefined {
  return store.icone.find((i) => i.id === id);
}
export function getIconaBySlug(slug: string): Icona | undefined {
  return store.icone.find((i) => i.slug === slug);
}
export function addIcona(data: Omit<Icona, "id">): Icona {
  const nuova: Icona = { ...data, id: nextId(store.icone) };
  store.icone.push(nuova);
  return nuova;
}
export function updateIcona(id: string, data: Partial<Icona>): Icona | null {
  const idx = store.icone.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  store.icone[idx] = { ...store.icone[idx], ...data, id };
  return store.icone[idx];
}
export function deleteIcona(id: string): boolean {
  const len = store.icone.length;
  store.icone = store.icone.filter((i) => i.id !== id);
  return store.icone.length < len;
}

// ======================== ORARI ========================
// FUTURO: supabase.from('orari')...
export function getOrari(): OrarioSettimanale[] {
  return store.orari;
}
export function addOrario(data: OrarioSettimanale): OrarioSettimanale {
  store.orari.push(data);
  return data;
}
export function updateOrario(giorno: string, data: OrarioSettimanale): OrarioSettimanale | null {
  const idx = store.orari.findIndex((o) => o.giorno === giorno);
  if (idx === -1) return null;
  store.orari[idx] = data;
  return store.orari[idx];
}
export function deleteOrario(giorno: string): boolean {
  const len = store.orari.length;
  store.orari = store.orari.filter((o) => o.giorno !== giorno);
  return store.orari.length < len;
}

// ======================== EVENTI ========================
// FUTURO: supabase.from('eventi')...
export function getEventi(): Evento[] {
  return store.eventi;
}
export function getEventoById(id: string): Evento | undefined {
  return store.eventi.find((e) => e.id === id);
}
export function addEvento(data: Omit<Evento, "id">): Evento {
  const nuovo: Evento = { ...data, id: nextId(store.eventi) };
  store.eventi.push(nuovo);
  return nuovo;
}
export function updateEvento(id: string, data: Partial<Evento>): Evento | null {
  const idx = store.eventi.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  store.eventi[idx] = { ...store.eventi[idx], ...data, id };
  return store.eventi[idx];
}
export function deleteEvento(id: string): boolean {
  const len = store.eventi.length;
  store.eventi = store.eventi.filter((e) => e.id !== id);
  return store.eventi.length < len;
}

// ======================== PREGHIERE ========================
// FUTURO: supabase.from('preghiere')...
export function getPreghiere(): Preghiera[] {
  return store.preghiere;
}
export function getPreghieraById(id: string): Preghiera | undefined {
  return store.preghiere.find((p) => p.id === id);
}
export function addPreghiera(data: Omit<Preghiera, "id">): Preghiera {
  const nuova: Preghiera = { ...data, id: nextId(store.preghiere) };
  store.preghiere.push(nuova);
  return nuova;
}
export function updatePreghiera(id: string, data: Partial<Preghiera>): Preghiera | null {
  const idx = store.preghiere.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.preghiere[idx] = { ...store.preghiere[idx], ...data, id };
  return store.preghiere[idx];
}
export function deletePreghiera(id: string): boolean {
  const len = store.preghiere.length;
  store.preghiere = store.preghiere.filter((p) => p.id !== id);
  return store.preghiere.length < len;
}

// ======================== FILE PRIVATI ========================
// FUTURO: supabase.storage.from('file_privati')...
export function getFilePrivati(): FilePrivato[] {
  return store.filePrivati;
}
export function getFilePrivatoById(id: string): FilePrivato | undefined {
  return store.filePrivati.find((f) => f.id === id);
}
export function addFilePrivato(data: Omit<FilePrivato, "id">): FilePrivato {
  const nuovo: FilePrivato = { ...data, id: nextId(store.filePrivati.length ? store.filePrivati : [{ id: "0" }]) };
  store.filePrivati.push(nuovo);
  return nuovo;
}
export function deleteFilePrivato(id: string): boolean {
  const len = store.filePrivati.length;
  store.filePrivati = store.filePrivati.filter((f) => f.id !== id);
  return store.filePrivati.length < len;
}
