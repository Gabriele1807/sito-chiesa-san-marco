export interface EventRow {
    id: string;
    titolo: string;
    data: string;
    persone: number;
    iscrizioni: number;
    pagate: number;
    postiDisponibili?: number;
    passato: boolean;
}
/**
 * Iscrizioni per evento: la lunghezza della barra è il numero di iscrizioni
 * (confrontabile tra eventi), la parte piena quelle già pagate, la traccia
 * chiara quelle da pagare. Numeri sempre scritti accanto.
 */
export default function EventRegistrations({ events }: {
    events: EventRow[];
}): import("react/jsx-runtime").JSX.Element;
