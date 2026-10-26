import type { LucideIcon } from "lucide-react";
/** Riquadro con un numero chiave (etichetta, valore, dettaglio facoltativo). */
export default function StatTile({ label, value, detail, icon: Icon, }: {
    label: string;
    value: number | string;
    detail?: string;
    icon: LucideIcon;
}): import("react/jsx-runtime").JSX.Element;
