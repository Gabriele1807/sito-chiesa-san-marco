import type { LucideIcon } from "lucide-react";

/** Riquadro con un numero chiave (etichetta, valore, dettaglio facoltativo). */
export default function StatTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <div className="text-foreground/60 flex items-center gap-2 text-xs font-semibold">
        <Icon className="text-gold h-4 w-4" aria-hidden />
        {label}
      </div>
      <p className="text-foreground mt-2 text-3xl font-semibold">
        {typeof value === "number" ? value.toLocaleString("it-IT") : value}
      </p>
      {detail && <p className="text-foreground/55 mt-1 text-xs">{detail}</p>}
    </div>
  );
}
