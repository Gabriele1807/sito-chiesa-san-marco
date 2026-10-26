/**
 * Svuota le copie offline delle pagine salvate dal service worker
 * (cache "sm-pages-*", vedi public/sw.js). Chiamata al logout: alcune
 * sezioni cambiano contenuto in base al ruolo e non devono restare
 * consultabili offline dopo l'uscita.
 */
export declare function clearOfflinePageCache(): Promise<void>;
