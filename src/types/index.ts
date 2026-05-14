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

export interface VideoCorso {
  id: string;
  titolo: string;
  descrizione: string;
  urlVideo: string;
  categoria: string;
  thumbnail?: string;
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

// ============================================================
// TIPI UTENTE (normali, registrati su MongoDB)
// ============================================================

/** Ruolo applicativo dell'utente, scelto nel quiz di registrazione */
export type UserRole = "credente" | "madre" | "padre" | "ospite_chiesa";

/** Fascia d'età per filtraggio contenuti */
export type AgeGroup = "0-11" | "12-18" | "19-29" | "30-45" | "46-65" | "65+";

/** Stato della richiesta di diventare admin */
export type AdminRequestStatus = "none" | "pending" | "approved" | "rejected";

/** Stato della richiesta di diventare superadmin (solo admin) */
export type SuperAdminRequestStatus = "none" | "pending" | "approved" | "rejected";

/** Profilo utente normale (MongoDB) */
export interface UserProfile {
  _id?: string;
  email: string;
  username: string;
  passwordHash: string;
  nome: string;
  cognome: string;

  // Dati quiz registrazione
  role: UserRole;
  ageGroup: AgeGroup;
  chiesa?: string; // chiesa di provenienza (per ospiti da altra chiesa)

  // Gestione accesso
  attivo: boolean;
  emailVerificata: boolean;

  // Richiesta admin
  adminRequest: AdminRequestStatus;
  adminRequestDate?: string; // ISO date

  // Richiesta superadmin (solo per account gia admin)
  superAdminRequest?: SuperAdminRequestStatus;
  superAdminRequestDate?: string; // ISO date

  // Metadati
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  ultimoAccesso?: string; // ISO date
}

/** Dati per la creazione di un nuovo utente (senza campi auto-generati) */
export type CreateUserData = Omit<
  UserProfile,
  "_id" | "passwordHash" | "attivo" | "emailVerificata" | "adminRequest" | "superAdminRequest" | "createdAt" | "updatedAt" | "ultimoAccesso"
> & {
  password: string;
  adminRequest?: boolean; // true se vuole richiedere di diventare admin
};

/** Vista pubblica dell'utente (senza hash password) */
export type UserPublic = Omit<UserProfile, "passwordHash">;

/** Info utente serializzata nel cookie/session client */
export interface UserSessionInfo {
  id: string;
  email: string;
  username: string;
  nome: string;
  cognome: string;
  role: UserRole;
  ageGroup: AgeGroup;
  chiesa?: string;
  isAdmin: false;
  adminRequest?: AdminRequestStatus;
}

/** Info admin serializzata nel cookie/session client */
export interface AdminSessionInfo {
  id: string;
  username: string;
  nome: string;
  cognome: string;
  ruolo: "superadmin" | "admin";
  superAdminRequest?: SuperAdminRequestStatus;
  isAdmin: true;
}

/** Tipo unificato per la sessione utente (admin o normale) */
export type SessionInfo = UserSessionInfo | AdminSessionInfo;

// ============================================================
// GESTIONE VISIBILITÀ SEZIONI (NAVIGATION VISIBILITY)
// ============================================================

/** Tutti i ruoli possibili nel sistema */
export type SystemRole = UserRole | "admin" | "superadmin" | "guest";

/** Accessibilità di una sezione per un ruolo specifico */
export type RoleAccessType = "full" | "coming_soon" | "hidden";

/** Configurazione di accesso per i ruoli di una sezione */
export interface SectionRoleConfig {
  guest?: RoleAccessType;
  credente?: RoleAccessType;
  madre?: RoleAccessType;
  padre?: RoleAccessType;
  ospite_chiesa?: RoleAccessType;
  admin?: RoleAccessType;
  superadmin?: RoleAccessType;
}

/** Configurazione completa di una sezione */
export interface SectionVisibility {
  id: string;
  sectionId: string; // es. "orari", "preghiere", "icone", etc.
  sectionLabel: string; // es. "Orari settimanali"
  isActive: boolean; // global on/off
  roleConfig: SectionRoleConfig;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
