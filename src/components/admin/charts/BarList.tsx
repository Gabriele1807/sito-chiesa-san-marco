import { CHART_ACCENT } from "./chart-tokens";

/**
 * Barre orizzontali a una serie per categorie ordinate (fasce d'età, ruoli):
 * etichetta a sinistra, valore alla punta, barre ≤ 24px con estremità
 * arrotondata. Ogni valore è anche scritto: niente informazioni solo nel colore.
 */
export default function BarList({
  data,
  unit,
}: {
  data: { label: string; value: number }[];
  unit: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li
          key={d.label}
          className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm"
          title={`${d.label}: ${d.value} ${unit}`}
        >
          <span className="text-foreground/70 truncate">{d.label}</span>
          <span className="flex items-center gap-2">
            {d.value > 0 && (
              <span
                className="block h-4 rounded-e-[4px]"
                style={{ width: `${(d.value / max) * 85}%`, backgroundColor: CHART_ACCENT }}
                aria-hidden
              />
            )}
            <span className="text-foreground text-xs font-semibold tabular-nums">{d.value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
