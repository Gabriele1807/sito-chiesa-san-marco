export interface UrgentAvviso {
    /** id + data di modifica: un avviso nascosto ricompare se viene aggiornato. */
    key: string;
    titolo: string;
    messaggio: string;
    link?: string;
}
/**
 * Striscia in cima a tutte le pagine pubbliche per gli avvisi "urgenti".
 * Ogni visitatore può nasconderla; la scelta resta nel browser.
 */
export default function UrgentAvvisiBanner({ avvisi }: {
    avvisi: UrgentAvviso[];
}): import("react/jsx-runtime").JSX.Element | null;
