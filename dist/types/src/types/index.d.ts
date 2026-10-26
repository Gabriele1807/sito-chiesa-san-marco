export interface Icona {
    id: string;
    slug: string;
    nome: string;
    nomeSanto: string;
    descrizione: string;
    descrizioneEstesa: string;
    posizione: string;
    categoria: string;
    immagini: string[];
    tecnica: string;
    autore: string;
    anno: string;
    testiCorrelati: string[];
    iconeCorrelate: string[];
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
    iconeCorrelate: string[];
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
export interface RaccoglimentoPoint {
    label: string;
    orario: string;
}
export interface Evento {
    id: string;
    slug: string;
    titolo: string;
    data: string;
    dataFine?: string;
    descrizione: string;
    luogo: string;
    referente?: string;
    postiDisponibili?: number;
    immagine?: string;
    showRaccoglimento?: boolean;
    raccoglimento?: RaccoglimentoPoint[];
    paymentDeadline?: string;
}
/**
 * Iscrizione a un evento (collezione MongoDB "event_registrations").
 *
 * I dati del partecipante e del padre devono corrispondere al documento
 * d'identità: vengono usati al momento dell'ingresso all'evento.
 *
 * Logica famiglia / duplicati:
 *  - stesso (padreNome + padreCognome) + stesso (nome + cognome) => DUPLICATO
 *  - stesso (padreNome + padreCognome) + (nome|cognome) diverso  => stessa FAMIGLIA
 */
export interface IscrizioneEvento {
    _id?: string;
    id?: string;
    eventoId: string;
    nome: string;
    cognome: string;
    padreNome: string;
    padreCognome: string;
    telefono: string;
    email?: string;
    note?: string;
    ha_pagato: boolean;
    registrationType?: "self" | "other" | "family";
    familyMembers?: Array<{
        role: "madre" | "padre" | "figlio";
        fullName: string;
    }>;
    fatherName?: string;
    fatherSurname?: string;
    raccoglimento?: "chiesa" | "luogo";
    raccoglimentoPunto?: RaccoglimentoPoint;
    createdByNome?: string;
    createdByCognome?: string;
    createdByEmail?: string;
    /** Account che ha creato l'iscrizione (impostato solo lato server dalla sessione).
     * È l'unico riferimento di proprietà affidabile: nome, cognome ed email del
     * profilo sono modificabili dall'utente. Assente nelle iscrizioni storiche. */
    createdByUserId?: string;
    createdByAccountType?: "user" | "admin";
    /** Lingua delle email (conferma, promemoria), dal sito al momento dell'iscrizione. */
    emailLocale?: "it" | "ar";
    /** Promemoria del giorno prima già inviato (impostato dal job, mai dal client). */
    reminderSentAt?: string;
    createdAt?: string;
}
/** Dati inviati dal form pubblico per creare una nuova iscrizione */
export type CreateIscrizioneData = Omit<IscrizioneEvento, "_id" | "id" | "createdAt" | "ha_pagato" | "reminderSentAt">;
/** Esito della creazione di un'iscrizione */
export interface CreateIscrizioneResult {
    success: boolean;
    iscrizione?: IscrizioneEvento;
    /** Codice errore applicativo per messaggi specifici lato client */
    errorCode?: "duplicate" | "full" | "validation" | "server";
    /** Se la stessa famiglia (stesso padre) ha già altre iscrizioni */
    sameFamily?: boolean;
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
/** Ruolo applicativo dell'utente, scelto nel quiz di registrazione */
export type UserRole = "credente" | "madre" | "padre" | "ospite_chiesa" | "prete";
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
    /** false per account creati solo via provider esterno (nessuna password reale impostata) */
    hasPassword?: boolean;
    /** ISO date, impostata ad ogni reset/cambio password. Usata da validateUserSession
     * per invalidare retroattivamente le sessioni JWT precedenti (vedi design spec §3):
     * un token con iat <= a questo timestamp (troncato al secondo) viene rifiutato. */
    passwordChangedAt?: string;
    nome: string;
    cognome: string;
    role: UserRole;
    ageGroup: AgeGroup;
    chiesa?: string;
    attivo: boolean;
    emailVerificata: boolean;
    adminRequest: AdminRequestStatus;
    adminRequestDate?: string;
    superAdminRequest?: SuperAdminRequestStatus;
    superAdminRequestDate?: string;
    createdAt: string;
    updatedAt: string;
    ultimoAccesso?: string;
}
/** Dati per la creazione di un nuovo utente (senza campi auto-generati) */
export type CreateUserData = Omit<UserProfile, "_id" | "passwordHash" | "attivo" | "emailVerificata" | "adminRequest" | "superAdminRequest" | "createdAt" | "updatedAt" | "ultimoAccesso"> & {
    password: string;
    adminRequest?: boolean;
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
    /** Indirizzo email confermato tramite il link inviato per email. */
    emailVerificata?: boolean;
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
    prete?: RoleAccessType;
    admin?: RoleAccessType;
    superadmin?: RoleAccessType;
}
/** Configurazione completa di una sezione */
export interface SectionVisibility {
    id: string;
    sectionId: string;
    sectionLabel: string;
    isActive: boolean;
    roleConfig: SectionRoleConfig;
    createdAt: string;
    updatedAt: string;
}
