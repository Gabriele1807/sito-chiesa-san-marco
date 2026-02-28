// ============================================================
// TIPI TYPESCRIPT PER IL SITO CHIESA COPTA
// ============================================================

export interface Icona {
  id: string;
  slug: string;
  nome: string;
  nomeSanto: string;
  descrizione: string;
  descrizioneEstesa: string;
  posizione: string; // es. "Navata sinistra", "Altare"
  categoria: string; // es. "Santi", "Vergine Maria", "Angeli"
  immagini: string[];
  tecnica: string;
  autore: string;
  anno: string;
  testiCorrelati: string[]; // id di TestoSacro
  iconeCorrelate: string[]; // id di altre Icone
}

export interface TestoSacro {
  id: string;
  slug: string;
  titolo: string;
  autore: string;
  tipo: "Sinassario" | "Omelia" | "Catechismo" | "Liturgia" | "Patristica" | "Altro";
  descrizione: string;
  urlPDF: string;
  copertina: string;
  iconeCorrelate: string[]; // id di Icone
}

export interface Preghiera {
  id: string;
  slug: string;
  titolo: string;
  descrizione: string;
  urlPDF?: string;
  testoInline?: string;
  categoria: string;
}

export interface Evento {
  id: string;
  slug: string;
  titolo: string;
  data: string; // ISO date string
  dataFine?: string;
  descrizione: string;
  luogo: string;
  postiDisponibili?: number;
  immagine?: string;
}

export interface IscrizioneEvento {
  nome: string;
  email: string;
  telefono: string;
  note?: string;
  eventoId: string;
}

export interface OrarioSettimanale {
  giorno: string;
  celebrazioni: {
    tipo: string;
    orario: string;
    note?: string;
  }[];
}

export type Locale = "it" | "ar";
