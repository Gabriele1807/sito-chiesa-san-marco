/**
 * Sezione YouTube della home.
 *
 * - Il lettore YouTube si carica solo quando si tocca l'anteprima: prima
 *   l'iframe partiva a ogni apertura della home (peso su telefono).
 * - Senza dati dall'API (chiave assente o errore) niente contenuti inventati:
 *   al posto del video un invito ad aprire il canale, niente statistiche.
 * - Impaginazione decisa dalla larghezza della sezione (container query):
 *   testo e video affiancati solo da @4xl, così a 1024px non si schiacciano.
 */
export default function YouTubeLiveSection(): import("react/jsx-runtime").JSX.Element;
