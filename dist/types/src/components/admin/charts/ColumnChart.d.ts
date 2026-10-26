interface Datum {
    label: string;
    /** Etichetta estesa per tooltip e tabella (es. "settembre 2026"). */
    fullLabel: string;
    value: number;
}
/**
 * Istogramma a una serie (una sola tinta). Colonne ≤ 24px con estremità
 * arrotondata, griglia sottile, etichetta solo sul valore più alto e
 * sull'ultimo; ogni colonna ha tooltip al passaggio e al focus da tastiera.
 */
export default function ColumnChart({ data, unit, title, }: {
    data: Datum[];
    unit: string;
    title: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
