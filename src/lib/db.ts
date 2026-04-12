/**
 * Database utility layer — legge da Supabase tramite content.ts.
 */

import {
  getLibri as contentGetLibri,
  getLibroBySlug as contentGetLibroBySlug,
  getIcone as contentGetIcone,
  getIconaBySlug as contentGetIconaBySlug,
  getPreghiere as contentGetPreghiere,
  getEventi as contentGetEventi,
  getEventoBySlug as contentGetEventoBySlug,
  getOrari as contentGetOrari,
} from "@/lib/mongo/content";
import type { Icona, TestoSacro, Preghiera, Evento, OrarioSettimanale, IscrizioneEvento } from "@/types";

// ============= ICONE =============
export async function getIcone(): Promise<Icona[]> {
  return contentGetIcone();
}

export async function getIconaBySlug(slug: string): Promise<Icona | undefined> {
  return contentGetIconaBySlug(slug);
}

// ============= TESTI SACRI =============
export async function getTestiSacri(): Promise<TestoSacro[]> {
  return contentGetLibri();
}

export async function getTestoSacroBySlug(slug: string): Promise<TestoSacro | undefined> {
  return contentGetLibroBySlug(slug);
}

// ============= PREGHIERE =============
export async function getPreghiere(): Promise<Preghiera[]> {
  return contentGetPreghiere();
}

// ============= EVENTI =============
export async function getEventi(): Promise<Evento[]> {
  return contentGetEventi();
}

export async function getEventoBySlug(slug: string): Promise<Evento | undefined> {
  return contentGetEventoBySlug(slug);
}

// ============= ORARI =============
export async function getOrari(): Promise<OrarioSettimanale[]> {
  return contentGetOrari();
}

// ============= ISCRIZIONI =============
export async function createIscrizione(iscrizione: IscrizioneEvento): Promise<{ success: boolean }> {
  console.log("Nuova iscrizione:", iscrizione);
  return { success: true };
}
