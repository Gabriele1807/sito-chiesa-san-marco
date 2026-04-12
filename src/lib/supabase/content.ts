/**
 * Supabase content layer — sostituisce src/lib/data/store.ts
 * Tutte le operazioni CRUD sui contenuti del sito (icone, testi sacri,
 * preghiere, eventi, orari) passano da qui.
 *
 * Se le tabelle sono vuote o non esistono ancora, getters tornano
 * i dati mock come fallback per garantire il funzionamento offline.
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import {
  icone as iconeInit,
  testiSacri as testiSacriInit,
  preghiere as preghiereInit,
  eventi as eventiInit,
  orariSettimanali as orariInit,
} from "@/lib/mock-data";
import type { Icona, TestoSacro, Preghiera, Evento, OrarioSettimanale } from "@/types";

// Helper: genera ID incrementale sicuro basandosi sul max. attuale
function nextId(arr: { id: string }[]): string {
  const max = arr.reduce((m, item) => Math.max(m, parseInt(item.id) || 0), 0);
  return String(max + 1);
}

// ============================================================
//  ROW → DOMAIN TYPE MAPPERS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToIcona(r: any): Icona {
  return {
    id: r.id,
    slug: r.slug,
    nome: r.nome ?? "",
    nomeSanto: r.nome_santo ?? "",
    descrizione: r.descrizione ?? "",
    descrizioneEstesa: r.descrizione_estesa ?? "",
    posizione: r.posizione ?? "",
    categoria: r.categoria ?? "",
    immagini: r.immagini ?? [],
    tecnica: r.tecnica ?? "",
    autore: r.autore ?? "",
    anno: r.anno ?? "",
    testiCorrelati: r.testi_correlati ?? [],
    iconeCorrelate: r.icone_correlate ?? [],
  };
}

function iconaToRow(data: Partial<Icona> & { id?: string }) {
  const row: Record<string, unknown> = {};
  if (data.id !== undefined) row.id = data.id;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.nome !== undefined) row.nome = data.nome;
  if (data.nomeSanto !== undefined) row.nome_santo = data.nomeSanto;
  if (data.descrizione !== undefined) row.descrizione = data.descrizione;
  if (data.descrizioneEstesa !== undefined) row.descrizione_estesa = data.descrizioneEstesa;
  if (data.posizione !== undefined) row.posizione = data.posizione;
  if (data.categoria !== undefined) row.categoria = data.categoria;
  if (data.immagini !== undefined) row.immagini = data.immagini;
  if (data.tecnica !== undefined) row.tecnica = data.tecnica;
  if (data.autore !== undefined) row.autore = data.autore;
  if (data.anno !== undefined) row.anno = data.anno;
  if (data.testiCorrelati !== undefined) row.testi_correlati = data.testiCorrelati;
  if (data.iconeCorrelate !== undefined) row.icone_correlate = data.iconeCorrelate;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTestoSacro(r: any): TestoSacro {
  return {
    id: r.id,
    slug: r.slug,
    titolo: r.titolo ?? "",
    autore: r.autore ?? "",
    tipo: r.tipo ?? "Altro",
    descrizione: r.descrizione ?? "",
    urlPDF: r.url_pdf ?? "",
    copertina: r.copertina ?? "",
    iconeCorrelate: r.icone_correlate ?? [],
  };
}

function testoSacroToRow(data: Partial<TestoSacro> & { id?: string }) {
  const row: Record<string, unknown> = {};
  if (data.id !== undefined) row.id = data.id;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.titolo !== undefined) row.titolo = data.titolo;
  if (data.autore !== undefined) row.autore = data.autore;
  if (data.tipo !== undefined) row.tipo = data.tipo;
  if (data.descrizione !== undefined) row.descrizione = data.descrizione;
  if (data.urlPDF !== undefined) row.url_pdf = data.urlPDF;
  if (data.copertina !== undefined) row.copertina = data.copertina;
  if (data.iconeCorrelate !== undefined) row.icone_correlate = data.iconeCorrelate;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPreghiera(r: any): Preghiera {
  return {
    id: r.id,
    slug: r.slug,
    titolo: r.titolo ?? "",
    descrizione: r.descrizione ?? "",
    urlPDF: r.url_pdf ?? undefined,
    testoInline: r.testo_inline ?? undefined,
    categoria: r.categoria ?? "",
  };
}

function preghieraToRow(data: Partial<Preghiera> & { id?: string }) {
  const row: Record<string, unknown> = {};
  if (data.id !== undefined) row.id = data.id;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.titolo !== undefined) row.titolo = data.titolo;
  if (data.descrizione !== undefined) row.descrizione = data.descrizione;
  if (data.urlPDF !== undefined) row.url_pdf = data.urlPDF;
  if (data.testoInline !== undefined) row.testo_inline = data.testoInline;
  if (data.categoria !== undefined) row.categoria = data.categoria;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvento(r: any): Evento {
  return {
    id: r.id,
    slug: r.slug,
    titolo: r.titolo ?? "",
    data: r.data ?? "",
    dataFine: r.data_fine ?? undefined,
    descrizione: r.descrizione ?? "",
    luogo: r.luogo ?? "",
    postiDisponibili: r.posti_disponibili ?? undefined,
    immagine: r.immagine ?? undefined,
  };
}

function eventoToRow(data: Partial<Evento> & { id?: string }) {
  const row: Record<string, unknown> = {};
  if (data.id !== undefined) row.id = data.id;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.titolo !== undefined) row.titolo = data.titolo;
  if (data.data !== undefined) row.data = data.data;
  if (data.dataFine !== undefined) row.data_fine = data.dataFine;
  if (data.descrizione !== undefined) row.descrizione = data.descrizione;
  if (data.luogo !== undefined) row.luogo = data.luogo;
  if (data.postiDisponibili !== undefined) row.posti_disponibili = data.postiDisponibili;
  if (data.immagine !== undefined) row.immagine = data.immagine;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrario(r: any): OrarioSettimanale {
  return {
    giorno: r.giorno,
    celebrazioni: r.celebrazioni ?? [],
  };
}

// ============================================================
//  ICONE
// ============================================================

export async function getIcone(): Promise<Icona[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("icone")
      .select("*")
      .order("created_at");
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToIcona);
    return [...iconeInit];
  } catch {
    return [...iconeInit];
  }
}

export async function getIconaById(id: string): Promise<Icona | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("icone")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return (await getIcone()).find((i) => i.id === id);
    return data ? rowToIcona(data) : undefined;
  } catch {
    return iconeInit.find((i) => i.id === id);
  }
}

export async function getIconaBySlug(slug: string): Promise<Icona | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("icone")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) return (await getIcone()).find((i) => i.slug === slug);
    return data ? rowToIcona(data) : undefined;
  } catch {
    return iconeInit.find((i) => i.slug === slug);
  }
}

export async function addIcona(raw: Omit<Icona, "id">): Promise<Icona> {
  const all = await getIcone();
  const id = nextId(all);
  const row = iconaToRow({ ...raw, id });
  const { data, error } = await supabaseAdmin.from("icone").insert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToIcona(data);
}

export async function updateIcona(id: string, raw: Partial<Icona>): Promise<Icona | null> {
  const row = iconaToRow(raw);
  const { data, error } = await supabaseAdmin
    .from("icone")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data ? rowToIcona(data) : null;
}

export async function deleteIcona(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("icone")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ============================================================
//  TESTI SACRI
// ============================================================

export async function getLibri(): Promise<TestoSacro[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("testi_sacri")
      .select("*")
      .order("created_at");
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToTestoSacro);
    return [...testiSacriInit];
  } catch {
    return [...testiSacriInit];
  }
}

export async function getLibroById(id: string): Promise<TestoSacro | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("testi_sacri")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return (await getLibri()).find((l) => l.id === id);
    return data ? rowToTestoSacro(data) : undefined;
  } catch {
    return testiSacriInit.find((l) => l.id === id);
  }
}

export async function getLibroBySlug(slug: string): Promise<TestoSacro | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("testi_sacri")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) return (await getLibri()).find((l) => l.slug === slug);
    return data ? rowToTestoSacro(data) : undefined;
  } catch {
    return testiSacriInit.find((l) => l.slug === slug);
  }
}

export async function addLibro(raw: Omit<TestoSacro, "id">): Promise<TestoSacro> {
  const all = await getLibri();
  const id = nextId(all);
  const row = testoSacroToRow({ ...raw, id });
  const { data, error } = await supabaseAdmin.from("testi_sacri").insert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToTestoSacro(data);
}

export async function updateLibro(id: string, raw: Partial<TestoSacro>): Promise<TestoSacro | null> {
  const row = testoSacroToRow(raw);
  const { data, error } = await supabaseAdmin
    .from("testi_sacri")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data ? rowToTestoSacro(data) : null;
}

export async function deleteLibro(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("testi_sacri")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ============================================================
//  PREGHIERE
// ============================================================

export async function getPreghiere(): Promise<Preghiera[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("preghiere")
      .select("*")
      .order("created_at");
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToPreghiera);
    return [...preghiereInit];
  } catch {
    return [...preghiereInit];
  }
}

export async function getPreghieraById(id: string): Promise<Preghiera | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("preghiere")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return (await getPreghiere()).find((p) => p.id === id);
    return data ? rowToPreghiera(data) : undefined;
  } catch {
    return preghiereInit.find((p) => p.id === id);
  }
}

export async function addPreghiera(raw: Omit<Preghiera, "id">): Promise<Preghiera> {
  const all = await getPreghiere();
  const id = nextId(all);
  const row = preghieraToRow({ ...raw, id });
  const { data, error } = await supabaseAdmin.from("preghiere").insert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToPreghiera(data);
}

export async function updatePreghiera(id: string, raw: Partial<Preghiera>): Promise<Preghiera | null> {
  const row = preghieraToRow(raw);
  const { data, error } = await supabaseAdmin
    .from("preghiere")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data ? rowToPreghiera(data) : null;
}

export async function deletePreghiera(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("preghiere")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ============================================================
//  EVENTI
// ============================================================

export async function getEventi(): Promise<Evento[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("eventi")
      .select("*")
      .order("data");
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToEvento);
    return [...eventiInit];
  } catch {
    return [...eventiInit];
  }
}

export async function getEventoById(id: string): Promise<Evento | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("eventi")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return (await getEventi()).find((e) => e.id === id);
    return data ? rowToEvento(data) : undefined;
  } catch {
    return eventiInit.find((e) => e.id === id);
  }
}

export async function getEventoBySlug(slug: string): Promise<Evento | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("eventi")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) return (await getEventi()).find((e) => e.slug === slug);
    return data ? rowToEvento(data) : undefined;
  } catch {
    return eventiInit.find((e) => e.slug === slug);
  }
}

export async function addEvento(raw: Omit<Evento, "id">): Promise<Evento> {
  const all = await getEventi();
  const id = nextId(all);
  const row = eventoToRow({ ...raw, id });
  const { data, error } = await supabaseAdmin.from("eventi").insert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToEvento(data);
}

export async function updateEvento(id: string, raw: Partial<Evento>): Promise<Evento | null> {
  const row = eventoToRow(raw);
  const { data, error } = await supabaseAdmin
    .from("eventi")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data ? rowToEvento(data) : null;
}

export async function deleteEvento(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("eventi")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ============================================================
//  ORARI SETTIMANALI
// ============================================================

export async function getOrari(): Promise<OrarioSettimanale[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("orari_settimanali")
      .select("*");
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToOrario);
    return [...orariInit];
  } catch {
    return [...orariInit];
  }
}

export async function addOrario(raw: OrarioSettimanale): Promise<OrarioSettimanale> {
  const { data, error } = await supabaseAdmin
    .from("orari_settimanali")
    .insert({ giorno: raw.giorno, celebrazioni: raw.celebrazioni })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToOrario(data);
}

export async function updateOrario(giorno: string, raw: OrarioSettimanale): Promise<OrarioSettimanale | null> {
  const { data, error } = await supabaseAdmin
    .from("orari_settimanali")
    .update({ celebrazioni: raw.celebrazioni })
    .eq("giorno", giorno)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data ? rowToOrario(data) : null;
}

export async function deleteOrario(giorno: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("orari_settimanali")
    .delete({ count: "exact" })
    .eq("giorno", giorno);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
