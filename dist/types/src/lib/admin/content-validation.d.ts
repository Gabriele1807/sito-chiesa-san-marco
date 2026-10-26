/**
 * Validazione runtime dei contenuti inviati dal pannello admin.
 *
 * Le route admin passavano il body JSON direttamente al database
 * (`insertOne({...body})`, `$set: body`): qualsiasi campo, di qualsiasi tipo.
 * Qui ogni entità ha una whitelist di campi con tipo e lunghezza massima;
 * i campi sconosciuti vengono scartati (nessun mass assignment), i tipi
 * sbagliati rifiutati con 400, e i campi usati come URL (link, iframe,
 * immagini) accettano solo http(s) o percorsi interni del sito.
 *
 * Stesso stile manuale del resto del progetto (nessuna libreria di schema).
 */
export declare const CONTENT_SCHEMAS: {
    eventi: {
        slug: {
            type: "string";
            max: number;
        };
        titolo: {
            type: "string";
            required: true;
            max: number;
        };
        data: {
            type: "string";
            required: true;
            max: number;
        };
        dataFine: {
            type: "string";
            max: number;
        };
        descrizione: {
            type: "string";
            max: number;
        };
        luogo: {
            type: "string";
            max: number;
        };
        referente: {
            type: "string";
            max: number;
        };
        postiDisponibili: {
            type: "number";
        };
        immagine: {
            type: "url";
        };
        showRaccoglimento: {
            type: "boolean";
        };
        raccoglimento: {
            type: "raccoglimento";
        };
        paymentDeadline: {
            type: "string";
            max: number;
        };
    };
    icone: {
        slug: {
            type: "string";
            max: number;
        };
        nome: {
            type: "string";
            required: true;
            max: number;
        };
        nomeSanto: {
            type: "string";
            max: number;
        };
        descrizione: {
            type: "string";
            max: number;
        };
        descrizioneEstesa: {
            type: "string";
            max: number;
        };
        posizione: {
            type: "string";
            max: number;
        };
        categoria: {
            type: "string";
            max: number;
        };
        immagini: {
            type: "urlArray";
        };
        tecnica: {
            type: "string";
            max: number;
        };
        autore: {
            type: "string";
            max: number;
        };
        anno: {
            type: "string";
            max: number;
        };
        testiCorrelati: {
            type: "stringArray";
        };
        iconeCorrelate: {
            type: "stringArray";
        };
    };
    libreria: {
        slug: {
            type: "string";
            max: number;
        };
        titolo: {
            type: "string";
            required: true;
            max: number;
        };
        autore: {
            type: "string";
            max: number;
        };
        tipo: {
            type: "string";
            max: number;
        };
        descrizione: {
            type: "string";
            max: number;
        };
        urlPDF: {
            type: "url";
        };
        copertina: {
            type: "url";
        };
        iconeCorrelate: {
            type: "stringArray";
        };
    };
    preghiere: {
        slug: {
            type: "string";
            max: number;
        };
        titolo: {
            type: "string";
            required: true;
            max: number;
        };
        descrizione: {
            type: "string";
            max: number;
        };
        urlPDF: {
            type: "url";
        };
        testoInline: {
            type: "string";
            max: number;
        };
        categoria: {
            type: "string";
            max: number;
        };
    };
    "video-corsi": {
        titolo: {
            type: "string";
            required: true;
            max: number;
        };
        descrizione: {
            type: "string";
            max: number;
        };
        urlVideo: {
            type: "url";
            required: true;
        };
        categoria: {
            type: "string";
            max: number;
        };
        thumbnail: {
            type: "url";
        };
    };
    "libreria-privata": {
        nome: {
            type: "string";
            required: true;
            max: number;
        };
        descrizione: {
            type: "string";
            max: number;
        };
        tipo: {
            type: "string";
            max: number;
        };
        url: {
            type: "url";
            required: true;
        };
    };
    orari: {
        giorno: {
            type: "string";
            required: true;
            max: number;
        };
        celebrazioni: {
            type: "celebrazioni";
            required: true;
        };
    };
};
export type ContentEntity = keyof typeof CONTENT_SCHEMAS;
export type ValidationResult = {
    ok: true;
    data: Record<string, unknown>;
} | {
    ok: false;
    error: string;
};
/** Solo http(s) assoluti o percorsi interni ("/..."); stringa vuota ammessa. */
export declare function isSafeUrl(value: string): boolean;
/**
 * Valida il body di una creazione (`create`, campi obbligatori richiesti) o
 * di una modifica (`update`, solo i campi presenti). Restituisce i soli
 * campi ammessi, già normalizzati; i campi sconosciuti vengono ignorati.
 */
export declare function validateContent(entity: ContentEntity, body: unknown, mode: "create" | "update"): ValidationResult;
/** Identificativo passato nel body/query: deve essere una stringa semplice, mai un oggetto (operatori MongoDB). */
export declare function parseContentId(value: unknown): string | null;
