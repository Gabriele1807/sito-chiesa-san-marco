"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft } from "lucide-react";
import { copticToJdn, isValidCopticDate } from "@/lib/calendario/coptic";
import { jdnToGregorian, type YMD } from "@/lib/calendario/jdn";
import { COPTIC_MONTHS } from "@/lib/calendario/months";
import { formatCoptic, formatGregorian, monthLabel } from "./format";

interface Props {
  initialYear: number;
  locale: string;
  onShow: (date: YMD) => void;
}

export default function CopticToGregorian({ initialYear, locale, onShow }: Props) {
  const t = useTranslations("calendario");
  const id = useId();
  const [form, setForm] = useState({ year: String(initialYear), month: "1", day: "1" });
  const [result, setResult] = useState<{ jdn: number } | "invalid" | null>(null);

  function convert(e: React.FormEvent) {
    e.preventDefault();
    const year = Number(form.year);
    const month = Number(form.month);
    const day = Number(form.day);
    if (!isValidCopticDate(year, month, day) || year < 1 || year > 9000) {
      setResult("invalid");
      return;
    }
    setResult({ jdn: copticToJdn(year, month, day) });
  }

  const era = t("annoMartiri");

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="border-border bg-surface rounded-2xl border px-5 py-4"
    >
      <h2
        id={`${id}-title`}
        className="font-display text-foreground flex items-center gap-2 text-xl"
      >
        <ArrowRightLeft className="text-accent h-5 w-5" aria-hidden />
        {t("inversa.titolo")}
      </h2>
      <form
        onSubmit={convert}
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_0.8fr_auto] sm:items-end"
        noValidate
      >
        <div>
          <label
            htmlFor={`${id}-y`}
            className="text-foreground/70 mb-1 block text-xs font-semibold"
          >
            {t("inversa.anno")}
          </label>
          <input
            id={`${id}-y`}
            className="input-field"
            inputMode="numeric"
            value={form.year}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value.replace(/\D/g, "").slice(0, 4) })
            }
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-m`}
            className="text-foreground/70 mb-1 block text-xs font-semibold"
          >
            {t("inversa.mese")}
          </label>
          <select
            id={`${id}-m`}
            className="input-field"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          >
            {COPTIC_MONTHS.map((m) => (
              <option key={m.number} value={m.number}>
                {m.number} · {monthLabel(m.number, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${id}-d`}
            className="text-foreground/70 mb-1 block text-xs font-semibold"
          >
            {t("inversa.giorno")}
          </label>
          <input
            id={`${id}-d`}
            className="input-field"
            inputMode="numeric"
            value={form.day}
            onChange={(e) =>
              setForm({ ...form, day: e.target.value.replace(/\D/g, "").slice(0, 2) })
            }
          />
        </div>
        <button type="submit" className="btn-secondary">
          {t("inversa.calcola")}
        </button>
      </form>

      <div aria-live="polite" className="mt-3 text-sm">
        {result === "invalid" && <p className="text-danger">{t("inversa.nonValida")}</p>}
        {result && result !== "invalid" && (
          <div className="space-y-2">
            <p className="text-foreground">
              {t("inversa.risultato", {
                copto: formatCoptic(
                  { year: Number(form.year), month: Number(form.month), day: Number(form.day) },
                  locale,
                  era
                ),
                gregoriano: formatGregorian(jdnToGregorian(result.jdn), locale),
              })}
            </p>
            <p className="text-foreground/60">
              {t("inversa.vigilia", {
                vigilia: formatGregorian(jdnToGregorian(result.jdn - 1), locale),
              })}
            </p>
            <button
              type="button"
              className="btn-link"
              onClick={() => onShow(jdnToGregorian(result.jdn))}
            >
              {t("inversa.mostra")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
