"use client";

import { useState } from "react";
import { CHART_ACCENT, CHART_GRID } from "./chart-tokens";

interface Datum {
  label: string;
  /** Etichetta estesa per tooltip e tabella (es. "settembre 2026"). */
  fullLabel: string;
  value: number;
}

const HEIGHT = 180;
const TOP = 16;
const BOTTOM = 28;
const LEFT = 36;
const BAR_MAX = 24;

/** Tick "puliti" (0, 1, 2, 5, 10, 20…) per l'asse verticale. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/**
 * Istogramma a una serie (una sola tinta). Colonne ≤ 24px con estremità
 * arrotondata, griglia sottile, etichetta solo sul valore più alto e
 * sull'ultimo; ogni colonna ha tooltip al passaggio e al focus da tastiera.
 */
export default function ColumnChart({
  data,
  unit,
  title,
}: {
  data: Datum[];
  unit: string;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const width = 560;
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)));
  const top = ticks[ticks.length - 1] || 1;
  const plotH = HEIGHT - TOP - BOTTOM;
  const band = (width - LEFT) / data.length;
  const barW = Math.min(BAR_MAX, band * 0.6);
  const y = (v: number) => TOP + plotH - (v / top) * plotH;
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const labelled = new Set([maxIndex, data.length - 1]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={title}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={LEFT} x2={width} y1={y(t)} y2={y(t)} stroke={CHART_GRID} strokeWidth={1} />
            <text
              x={LEFT - 6}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-foreground/55 text-[13px] tabular-nums"
            >
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = LEFT + band * i + band / 2;
          const h = Math.max(0, TOP + plotH - y(d.value));
          const r = Math.min(4, h / 2, barW / 2);
          const x0 = cx - barW / 2;
          const yTop = y(d.value);
          // Estremità superiore arrotondata, base squadrata.
          const path =
            h > 0
              ? `M${x0},${TOP + plotH} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + barW - r} Q${x0 + barW},${yTop} ${x0 + barW},${yTop + r} V${TOP + plotH} Z`
              : "";
          return (
            <g
              key={d.fullLabel}
              tabIndex={0}
              role="button"
              aria-label={`${d.fullLabel}: ${d.value} ${unit}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="cursor-default outline-none"
            >
              {/* Area di hover più grande della colonna */}
              <rect x={LEFT + band * i} y={TOP} width={band} height={plotH} fill="transparent" />
              {path && (
                <path
                  d={path}
                  fill={CHART_ACCENT}
                  opacity={active === null || active === i ? 1 : 0.55}
                />
              )}
              {labelled.has(i) && d.value > 0 && (
                <text
                  x={cx}
                  y={yTop - 5}
                  textAnchor="middle"
                  className="fill-foreground text-[14px] font-semibold"
                >
                  {d.value}
                </text>
              )}
              <text
                x={cx}
                y={HEIGHT - 7}
                textAnchor="middle"
                className="fill-foreground/60 text-[13px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {active !== null && (
        <div
          className="border-border bg-surface pointer-events-none absolute top-0 rounded-lg border px-3 py-2 text-xs shadow-md"
          style={{
            left: `${((LEFT + band * active + band / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-foreground text-sm font-semibold">
            {data[active].value} {unit}
          </p>
          <p className="text-foreground/60">{data[active].fullLabel}</p>
        </div>
      )}
    </div>
  );
}
