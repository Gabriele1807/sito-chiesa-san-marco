/**
 * Database utility layer — legge da Supabase tramite content.ts.
 */

import { unstable_cache } from "next/cache";

import {
  getLibri as contentGetLibri,
  getLibroBySlug as contentGetLibroBySlug,
  getIcone as contentGetIcone,
  getIconaBySlug as contentGetIconaBySlug,
  getPreghiere as contentGetPreghiere,
  getVideoCorsi as contentGetVideoCorsi,
  getEventi as contentGetEventi,
  getEventoBySlug as contentGetEventoBySlug,
  getEventoById as contentGetEventoById,
  getOrari as contentGetOrari,
} from "@/lib/mongo/content";
import {
  createIscrizione as regCreateIscrizione,
  getIscrizioniByEvento as regGetIscrizioniByEvento,
  getIscrizioniByUser as regGetIscrizioniByUser,
  countIscrizioniByEvento as regCountIscrizioniByEvento,
  countIscrizioniPerEvento as regCountIscrizioniPerEvento,
  deleteIscrizione as regDeleteIscrizione,
} from "@/lib/mongo/registrations";
import type {
  Icona,
  TestoSacro,
  Preghiera,
  VideoCorso,
  Evento,
  OrarioSettimanale,
  IscrizioneEvento,
  CreateIscrizioneData,
  CreateIscrizioneResult,
} from "@/types";

const CONTENT_REVALIDATE_SECONDS = 60;

const getIconeCached = unstable_cache(
  async () => contentGetIcone(),
  ["content-icone"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "icone"] }
);

const getIconaBySlugCached = unstable_cache(
  async (slug: string) => contentGetIconaBySlug(slug),
  ["content-icona-by-slug"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "icone"] }
);

const getTestiSacriCached = unstable_cache(
  async () => contentGetLibri(),
  ["content-libreria"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "libreria"] }
);

const getTestoSacroBySlugCached = unstable_cache(
  async (slug: string) => contentGetLibroBySlug(slug),
  ["content-libro-by-slug"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "libreria"] }
);

const getPreghiereCached = unstable_cache(
  async () => contentGetPreghiere(),
  ["content-preghiere"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "preghiere"] }
);

const getVideoCorsiCached = unstable_cache(
  async () => contentGetVideoCorsi(),
  ["content-video-corsi"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "video-corsi"] }
);

const getEventiCached = unstable_cache(
  async () => contentGetEventi(),
  ["content-eventi"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "eventi"] }
);

const getEventoBySlugCached = unstable_cache(
  async (slug: string) => contentGetEventoBySlug(slug),
  ["content-evento-by-slug"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "eventi"] }
);

const getOrariCached = unstable_cache(
  async () => contentGetOrari(),
  ["content-orari"],
  { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content", "orari"] }
);

// ============= ICONE =============
export async function getIcone(): Promise<Icona[]> {
  return getIconeCached();
}

export async function getIconaBySlug(slug: string): Promise<Icona | undefined> {
  return getIconaBySlugCached(slug);
}

// ============= TESTI SACRI =============
export async function getTestiSacri(): Promise<TestoSacro[]> {
  return getTestiSacriCached();
}

export async function getTestoSacroBySlug(slug: string): Promise<TestoSacro | undefined> {
  return getTestoSacroBySlugCached(slug);
}

// ============= PREGHIERE =============
export async function getPreghiere(): Promise<Preghiera[]> {
  return getPreghiereCached();
}

export async function getVideoCorsi(): Promise<VideoCorso[]> {
  return getVideoCorsiCached();
}

// ============= EVENTI =============
export async function getEventi(): Promise<Evento[]> {
  return getEventiCached();
}

export async function getEventoBySlug(slug: string): Promise<Evento | undefined> {
  return getEventoBySlugCached(slug);
}

export async function getEventoById(id: string): Promise<Evento | undefined> {
  return contentGetEventoById(id);
}

// ============= ORARI =============
export async function getOrari(): Promise<OrarioSettimanale[]> {
  return getOrariCached();
}

// ============= ISCRIZIONI =============
export async function createIscrizione(data: CreateIscrizioneData): Promise<CreateIscrizioneResult> {
  return regCreateIscrizione(data);
}

export async function getIscrizioniByEvento(eventoId: string): Promise<IscrizioneEvento[]> {
  return regGetIscrizioniByEvento(eventoId);
}

export async function getIscrizioniByUser(nome: string, cognome: string, email?: string): Promise<IscrizioneEvento[]> {
  return regGetIscrizioniByUser(nome, cognome, email);
}

export async function countIscrizioniByEvento(eventoId: string): Promise<number> {
  return regCountIscrizioniByEvento(eventoId);
}

export async function countIscrizioniPerEvento(): Promise<Record<string, number>> {
  return regCountIscrizioniPerEvento();
}

export async function deleteIscrizione(id: string): Promise<boolean> {
  return regDeleteIscrizione(id);
}
