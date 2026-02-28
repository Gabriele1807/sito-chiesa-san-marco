/**
 * Database utility layer — reads from the shared in-memory store.
 * FUTURO: Sostituire con chiamate dirette a Supabase.
 */

import {
  getLibri,
  getLibroBySlug,
  getIcone as storeGetIcone,
  getIconaBySlug as storeGetIconaBySlug,
  getPreghiere as storeGetPreghiere,
  getEventi as storeGetEventi,
  getOrari as storeGetOrari,
} from "@/lib/data/store";
import type { Icona, TestoSacro, Preghiera, Evento, OrarioSettimanale, IscrizioneEvento } from "@/types";

// ============= ICONE =============
export async function getIcone(): Promise<Icona[]> {
  return storeGetIcone();
}

export async function getIconaBySlug(slug: string): Promise<Icona | undefined> {
  return storeGetIconaBySlug(slug);
}

// ============= TESTI SACRI =============
export async function getTestiSacri(): Promise<TestoSacro[]> {
  return getLibri();
}

export async function getTestoSacroBySlug(slug: string): Promise<TestoSacro | undefined> {
  return getLibroBySlug(slug);
}

// ============= PREGHIERE =============
export async function getPreghiere(): Promise<Preghiera[]> {
  return storeGetPreghiere();
}

// ============= EVENTI =============
export async function getEventi(): Promise<Evento[]> {
  return storeGetEventi();
}

export async function getEventoBySlug(slug: string): Promise<Evento | undefined> {
  return storeGetEventi().find((e) => e.slug === slug);
}

// ============= ORARI =============
export async function getOrari(): Promise<OrarioSettimanale[]> {
  return storeGetOrari();
}

// ============= ISCRIZIONI =============
export async function createIscrizione(iscrizione: IscrizioneEvento): Promise<{ success: boolean }> {
  // FUTURO: supabase.from('iscrizioni').insert(iscrizione)
  console.log("Nuova iscrizione:", iscrizione);
  return { success: true };
}
