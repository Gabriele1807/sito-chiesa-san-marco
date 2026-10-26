/**
 * Funzioni condivise per l'iscrizione alle notifiche push del dispositivo:
 * usate dal riquadro della pagina Avvisi (PushToggle) e dall'invito
 * mostrato dentro l'app installata (NotificationPrompt).
 */
export declare const VAPID_PUBLIC_KEY: string;
/** Errore di registrazione sul server; `code` è quello restituito dall'API (es. "not_configured"). */
export declare class PushSaveError extends Error {
    readonly code: string;
    constructor(code: string);
}
/** True se questo browser può ricevere notifiche push (API presenti e chiavi configurate). */
export declare function pushSupported(): boolean;
/** Iscrizione attuale del dispositivo, se esiste. */
export declare function currentPushSubscription(): Promise<PushSubscription | null>;
/**
 * Chiede il permesso (va chiamata da un tocco dell'utente), iscrive il
 * dispositivo e lo registra sul server. Restituisce l'esito del permesso;
 * lancia un errore se l'iscrizione non riesce.
 */
export declare function subscribeToPush(locale: string): Promise<NotificationPermission>;
/** Disiscrive il dispositivo e lo rimuove dal server. */
export declare function unsubscribeFromPush(): Promise<void>;
