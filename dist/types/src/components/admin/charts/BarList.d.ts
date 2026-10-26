/**
 * Barre orizzontali a una serie per categorie ordinate (fasce d'età, ruoli):
 * etichetta a sinistra, valore alla punta, barre ≤ 24px con estremità
 * arrotondata. Ogni valore è anche scritto: niente informazioni solo nel colore.
 */
export default function BarList({ data, unit, }: {
    data: {
        label: string;
        value: number;
    }[];
    unit: string;
}): import("react/jsx-runtime").JSX.Element;
