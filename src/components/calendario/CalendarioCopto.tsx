"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Radio,
  RotateCcw,
  CalendarCheck,
} from "lucide-react";
import {
  computeDayState,
  instantFromLocal,
  sunsetForDay,
  type DayState,
} from "@/lib/calendario/service";
import { resolveLiturgicalDay, type CalendarConfig } from "@/lib/calendario/resolver";
import { contentKeysFor } from "@/lib/calendario/content";
import {
  gregorianToJdn,
  isValidGregorianDate,
  jdnToGregorian,
  type YMD,
} from "@/lib/calendario/jdn";
import { getZonedParts } from "@/lib/calendario/tz";
import type { PublicCalendarConfig } from "@/lib/mongo/calendario";
import { nowMs, useLiveClock } from "./useLiveClock";
import { useCalendarPrefs } from "./prefs";
import { resolveLocation } from "./locations";
import { useDayContent } from "./useDayContent";
import DayCard from "./DayCard";
import DayReadings from "./DayReadings";
import LocationPanel from "./LocationPanel";
import CopticToGregorian from "./CopticToGregorian";
import { formatTime, parseDateInput, parseTimeInput, toDateInput, toTimeInput } from "./format";

type Mode = "live" | "manual";

export default function CalendarioCopto({
  initialConfig,
  initialDate = null,
}: {
  initialConfig: PublicCalendarConfig;
  /** "AAAA-MM-GG" già validata: se presente la pagina parte in Manuale su quel giorno (alle 12:00). */
  initialDate?: string | null;
}) {
  const t = useTranslations("calendario");
  const locale = useLocale();
  const id = useId();

  const config = useMemo<CalendarConfig>(
    () => ({ feasts: initialConfig.feasts, rules: initialConfig.rules }),
    [initialConfig]
  );

  const prefs = useCalendarPrefs();
  const { location, source } = resolveLocation(prefs?.location, initialConfig.location, {
    preset: (cityId) => t(`citta.${cityId}`),
    geo: t("posizioneRilevata"),
  });
  const manualSunset = prefs?.manualSunset ?? null;
  const { lat, lon, name } = location;

  const [mode, setMode] = useState<Mode>(initialDate ? "manual" : "live");
  const [manual, setManual] = useState(
    initialDate ? { date: initialDate, time: "12:00" } : { date: "", time: "" }
  );

  const nextEventAfter = useCallback(
    (now: number, timeZone: string) =>
      computeDayState(now, timeZone, { name, lat, lon }, manualSunset).nextChangeAt,
    [name, lat, lon, manualSunset]
  );
  const clock = useLiveClock(mode === "live", nextEventAfter);

  const manualInstant = useMemo(() => {
    if (!clock) return null;
    const date = parseDateInput(manual.date);
    const time = parseTimeInput(manual.time);
    if (!date || !time || !isValidGregorianDate(date.year, date.month, date.day)) return null;
    return instantFromLocal(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
      clock.timeZone
    );
  }, [clock, manual.date, manual.time]);

  const instant = mode === "live" ? (clock?.now ?? null) : manualInstant;

  const state: DayState | null = useMemo(
    () =>
      instant !== null && clock
        ? computeDayState(instant, clock.timeZone, { name, lat, lon }, manualSunset)
        : null,
    [instant, clock, name, lat, lon, manualSunset]
  );

  const info = state ? resolveLiturgicalDay(state.liturgical.jdn, config) : null;
  const bounds = useMemo(() => {
    if (!state) return undefined;
    const loc = { name, lat, lon };
    const civil = state.civil.jdn;
    // Il giorno liturgico va dal tramonto del giorno civile precedente al suo tramonto.
    const litJdn = state.liturgical.jdn;
    const start =
      litJdn === civil
        ? sunsetForDay(civil - 1, state.timeZone, loc, manualSunset).at
        : state.sunset.at;
    const end =
      litJdn === civil
        ? state.sunset.at
        : sunsetForDay(civil + 1, state.timeZone, loc, manualSunset).at;
    return { start, end };
  }, [state, name, lat, lon, manualSunset]);

  const keys = info ? contentKeysFor(info, config) : null;
  const { bundle, loading } = useDayContent(keys);

  // --- Azioni ---
  function setManualFrom(instantMs: number, timeZone: string) {
    const p = getZonedParts(instantMs, timeZone);
    setManual({ date: toDateInput(p), time: toTimeInput(p.hour, p.minute) });
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (next === "manual" && clock) setManualFrom(nowMs(), clock.timeZone);
    setMode(next);
  }

  function shiftDay(delta: number) {
    const date = parseDateInput(manual.date);
    if (!date || !isValidGregorianDate(date.year, date.month, date.day)) return;
    const shifted = jdnToGregorian(gregorianToJdn(date.year, date.month, date.day) + delta);
    setManual({ ...manual, date: toDateInput(shifted) });
  }

  function goToday() {
    if (clock) setManualFrom(nowMs(), clock.timeZone);
  }

  function showCopticDay(date: YMD) {
    setManual({ date: toDateInput(date), time: "12:00" });
    setMode("manual");
    document.getElementById(`${id}-day`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      {/* Interruttore Live / Manuale */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label={t("modalita")}
          className="border-border bg-surface inline-flex rounded-xl border p-1"
        >
          {(["live", "manual"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => switchMode(m)}
              className={`focus-visible:ring-gold inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                mode === m ? "bg-accent text-white" : "text-foreground/70 hover:bg-surface-2"
              }`}
            >
              {m === "live" ? (
                <Radio className="h-4 w-4" aria-hidden />
              ) : (
                <Clock className="h-4 w-4" aria-hidden />
              )}
              {m === "live" ? t("live") : t("manuale")}
            </button>
          ))}
        </div>
        <p className="text-foreground/60 text-xs">
          {mode === "live" ? t("liveDescrizione") : t("manualeDescrizione")}
        </p>
      </div>

      {/* Controlli manuali */}
      {mode === "manual" && (
        <section
          aria-label={t("manuale")}
          className="border-border bg-surface space-y-3 rounded-2xl border px-5 py-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${id}-date`}
                className="text-foreground/70 mb-1 block text-xs font-semibold"
              >
                {t("data")}
              </label>
              <input
                id={`${id}-date`}
                type="date"
                className="input-field"
                value={manual.date}
                min="0001-01-01"
                max="9999-12-31"
                onChange={(e) => setManual({ ...manual, date: e.target.value })}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-time`}
                className="text-foreground/70 mb-1 block text-xs font-semibold"
              >
                {t("ora")}
              </label>
              <input
                id={`${id}-time`}
                type="time"
                className="input-field"
                value={manual.time}
                onChange={(e) => setManual({ ...manual, time: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary px-3" onClick={() => shiftDay(-1)}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              {t("giornoPrecedente")}
            </button>
            <button type="button" className="btn-secondary px-3" onClick={() => shiftDay(1)}>
              {t("giornoSuccessivo")}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </button>
            <button type="button" className="btn-secondary px-3" onClick={goToday}>
              <CalendarCheck className="h-4 w-4" aria-hidden />
              {t("vaiAOggi")}
            </button>
            <button type="button" className="btn-primary px-4" onClick={() => switchMode("live")}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t("tornaLive")}
            </button>
          </div>
        </section>
      )}

      {/* Giorno */}
      <div id={`${id}-day`} className="scroll-mt-24">
        {info && state ? (
          <DayCard info={info} state={state} bounds={bounds} />
        ) : (
          <div className="empty-state flex items-center justify-center gap-2" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("caricamento")}
          </div>
        )}
        {mode === "live" && state && (
          <p className="text-foreground/60 mt-2 text-xs">
            {state.nextChangeKind === "sunset"
              ? t("prossimoCambioTramonto", {
                  ora: formatTime(state.nextChangeAt, state.timeZone, locale),
                })
              : t("prossimoCambioMezzanotte")}
          </p>
        )}
      </div>

      <LocationPanel
        state={state}
        location={location}
        source={source}
        stored={prefs?.location}
        manualSunset={manualSunset}
        defaultLocation={initialConfig.location}
        locale={locale}
      />

      {/* Letture */}
      <section aria-labelledby={`${id}-letture`} className="space-y-3">
        <h2 id={`${id}-letture`} className="font-display text-foreground text-2xl">
          {t("letture.titolo")}
        </h2>
        <DayReadings bundle={bundle} loading={Boolean(keys) && loading} />
      </section>

      {info && (
        <CopticToGregorian initialYear={info.coptic.year} locale={locale} onShow={showCopticDay} />
      )}
    </div>
  );
}
