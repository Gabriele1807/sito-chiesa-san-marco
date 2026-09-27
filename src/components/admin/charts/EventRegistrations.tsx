import { CHART_ACCENT, CHART_TRACK } from "./chart-tokens";

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

function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Iscrizioni per evento: la lunghezza della barra è il numero di iscrizioni
 * (confrontabile tra eventi), la parte piena quelle già pagate, la traccia
 * chiara quelle da pagare. Numeri sempre scritti accanto.
 */
export default function EventRegistrations({ events }: { events: EventRow[] }) {
  const max = Math.max(1, ...events.map((e) => e.iscrizioni));
  return (
    <div className="space-y-4">
      <div className="text-foreground/70 flex flex-wrap gap-4 text-xs" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_ACCENT }} /> Pagate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_TRACK }} /> Da pagare
        </span>
      </div>
      <ul className="space-y-4">
        {events.map((e) => {
          const width = (e.iscrizioni / max) * 100;
          const paidShare = e.iscrizioni ? (e.pagate / e.iscrizioni) * 100 : 0;
          return (
            <li key={e.id} className={e.passato ? "opacity-60" : ""}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="text-foreground font-semibold">
                  {e.titolo}
                  <span className="text-foreground/50 ms-2 text-xs font-normal">
                    {formatDate(e.data)}
                    {e.passato ? " · concluso" : ""}
                  </span>
                </span>
                <span className="text-foreground/65 text-xs tabular-nums">
                  {e.persone} {e.persone === 1 ? "persona" : "persone"}
                  {e.postiDisponibili ? ` su ${e.postiDisponibili} posti` : ""} · {e.pagate}/
                  {e.iscrizioni} pagate
                </span>
              </div>
              {e.iscrizioni > 0 ? (
                <div
                  className="flex h-3 overflow-hidden rounded-e-[4px]"
                  style={{ width: `${Math.max(width, 2)}%` }}
                  role="img"
                  aria-label={`${e.iscrizioni} iscrizioni, ${e.pagate} pagate`}
                >
                  <span style={{ width: `${paidShare}%`, backgroundColor: CHART_ACCENT }} />
                  {/* spazio di 2px tra la parte pagata e quella da pagare */}
                  {paidShare > 0 && paidShare < 100 && (
                    <span className="bg-surface w-[2px] shrink-0" />
                  )}
                  <span className="flex-1" style={{ backgroundColor: CHART_TRACK }} />
                </div>
              ) : (
                <p className="text-foreground/45 text-xs">Nessuna iscrizione</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
