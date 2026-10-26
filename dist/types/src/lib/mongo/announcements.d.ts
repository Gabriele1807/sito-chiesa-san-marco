/**
 * Avvisi e annunci della comunità ("Liturgia spostata alle 10", "Chiesa
 * chiusa lunedì"…). Collezione: "avvisi".
 *
 * Ogni avviso ha un livello (info / importante / urgente), un periodo di
 * pubblicazione opzionale (inizio, scadenza) e un testo arabo opzionale:
 * senza traduzione i visitatori in arabo vedono il testo italiano.
 * Gli avvisi scaduti restano nel pannello admin ma spariscono dal sito
 * senza intervento manuale.
 *
 * ⚠️ Solo lato server.
 */
export declare const AVVISO_LEVELS: readonly ["info", "importante", "urgente"];
export type AvvisoLevel = (typeof AVVISO_LEVELS)[number];
export interface Avviso {
    id: string;
    titolo: string;
    messaggio: string;
    titoloAr?: string;
    messaggioAr?: string;
    livello: AvvisoLevel;
    /** Link opzionale (pagina del sito o http/https). */
    link?: string;
    /** ISO 8601; se assente l'avviso è visibile subito. */
    inizio?: string;
    /** ISO 8601; se assente l'avviso non scade. */
    scadenza?: string;
    pubblicato: boolean;
    createdAt: string;
    updatedAt: string;
    /** Ultimo invio della notifica push per questo avviso. */
    pushSentAt?: string;
    /** Id dell'ultimo invio push e dispositivi che mancavano quando si è fermato (0 = completato). */
    pushRunId?: string;
    pushRemaining?: number;
}
export type AvvisoInput = Pick<Avviso, "titolo" | "messaggio" | "titoloAr" | "messaggioAr" | "livello" | "link" | "inizio" | "scadenza" | "pubblicato">;
type ValidationResult = {
    ok: true;
    data: Partial<AvvisoInput>;
} | {
    ok: false;
    error: string;
};
/**
 * Valida il body inviato dal pannello admin. In creazione titolo e
 * messaggio sono obbligatori; in modifica solo i campi presenti vengono
 * aggiornati. Campi sconosciuti ignorati.
 */
export declare function validateAvviso(body: unknown, mode: "create" | "update"): ValidationResult;
/** Tutti gli avvisi (pannello admin), più recenti prima. */
export declare function listAvvisi(): Promise<Avviso[]>;
/** Avvisi pubblicati e non ancora scaduti (il filtro sull'inizio si applica in `filterActiveAvvisi`). */
export declare function listPublishedAvvisi(now?: Date): Promise<Avviso[]>;
/**
 * Filtra per periodo di pubblicazione e ordina per importanza (urgente
 * prima), poi dal più recente. Separato dalla query perché la lista viene
 * messa in cache per qualche secondo mentre l'orario corrente cambia.
 */
export declare function filterActiveAvvisi(avvisi: Avviso[], now?: Date): Avviso[];
export declare function getAvvisoById(id: string): Promise<Avviso | null>;
export declare function createAvviso(data: AvvisoInput): Promise<Avviso>;
export declare function updateAvviso(id: string, data: Partial<AvvisoInput>): Promise<Avviso | null>;
export declare function markAvvisoPushRun(id: string, runId: string, remaining: number): Promise<void>;
export declare function deleteAvviso(id: string): Promise<boolean>;
/** Testo nella lingua del visitatore, con ripiego sull'italiano. */
export declare function localizeAvviso(avviso: Avviso, locale: string): {
    titolo: string;
    messaggio: string;
};
export {};
