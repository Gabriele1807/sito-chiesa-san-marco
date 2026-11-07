"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { CONTENT_LEVELS, contentKeysFor, type ContentLevel } from "@/lib/calendario/content";
import { copticToJdn, isValidCopticDate, jdnToCoptic } from "@/lib/calendario/coptic";
import { gregorianToJdn, isValidGregorianDate } from "@/lib/calendario/jdn";
import { COPTIC_MONTHS } from "@/lib/calendario/months";
import { findDayForKey } from "@/lib/calendario/lookup";
import {
  resolveLiturgicalDay,
  type CalendarConfig,
  type LiturgicalDayInfo,
} from "@/lib/calendario/resolver";
import { formatCoptic, formatGregorian, parseDateInput } from "@/components/calendario/format";
import ContentEditor from "./ContentEditor";
import {
  cardClass,
  inputClass,
  labelClass,
  secondaryButton,
  type CalendarioContenuto,
} from "./shared";

interface Props {
  config: CalendarConfig;
  todayJdn: number;
}

export default function ContenutiTab({ config, todayJdn }: Props) {
  const t = useTranslations("adminCalendario");
  const tc = useTranslations("calendario");
  const locale = useLocale();
  const [searchMode, setSearchMode] = useState<"gregorian" | "coptic">("gregorian");
  const [gDate, setGDate] = useState("");
  const todayCoptic = jdnToCoptic(todayJdn);
  const [cDate, setCDate] = useState({
    year: String(todayCoptic.year),
    month: String(todayCoptic.month),
    day: String(todayCoptic.day),
  });
  const [searchError, setSearchError] = useState(false);
  const [info, setInfo] = useState<LiturgicalDayInfo>(() => resolveLiturgicalDay(todayJdn, config));
  const [all, setAll] = useState<CalendarioContenuto[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<{
    level: ContentLevel;
    key: string;
    info: LiturgicalDayInfo | null;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/calendario/contenuti");
    if (res.ok) {
      setAll(await res.json());
      setLoadError(false);
    } else {
      setAll([]);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale dal server
    load();
  }, [load]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    let jdn: number | null = null;
    if (searchMode === "gregorian") {
      const d = parseDateInput(gDate);
      if (d && isValidGregorianDate(d.year, d.month, d.day))
        jdn = gregorianToJdn(d.year, d.month, d.day);
    } else {
      const [y, m, d] = [Number(cDate.year), Number(cDate.month), Number(cDate.day)];
      if (isValidCopticDate(y, m, d)) jdn = copticToJdn(y, m, d);
    }
    setSearchError(jdn === null);
    if (jdn !== null) {
      setInfo(resolveLiturgicalDay(jdn, config));
      setEditing(null);
    }
  }

  const keys = contentKeysFor(info, config);
  const find = (level: ContentLevel, key: string) =>
    all?.find((c) => c.livello === level && c.chiave === key) ?? null;
  const othersFor = (dayInfo: LiturgicalDayInfo | null) => {
    if (!dayInfo) return {};
    const k = contentKeysFor(dayInfo, config);
    return Object.fromEntries(
      CONTENT_LEVELS.map((l) => [l, find(l, k[l]) ?? undefined]).filter(([, v]) => v)
    ) as Partial<Record<ContentLevel, CalendarioContenuto>>;
  };

  function openFromList(c: CalendarioContenuto) {
    const dayInfo = findDayForKey(c.livello, c.chiave, config, todayCoptic.year);
    setEditing({ level: c.livello, key: c.chiave, info: dayInfo });
    if (dayInfo) setInfo(dayInfo);
  }

  const era = tc("annoMartiri");

  return (
    <div className="space-y-6">
      {/* Ricerca */}
      <form onSubmit={search} className={`${cardClass} space-y-3`} aria-labelledby="cerca-title">
        <h2 id="cerca-title" className="text-foreground font-bold">
          {t("cerca.titolo")}
        </h2>
        <div role="radiogroup" aria-label={t("cerca.titolo")} className="flex gap-4 text-sm">
          {(["gregorian", "coptic"] as const).map((m) => (
            <label key={m} className="flex items-center gap-2">
              <input
                type="radio"
                name="search-mode"
                checked={searchMode === m}
                onChange={() => setSearchMode(m)}
                className="accent-gold"
              />
              {m === "gregorian" ? t("cerca.perGregoriana") : t("cerca.perCopta")}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {searchMode === "gregorian" ? (
            <div>
              <label htmlFor="cerca-g" className={labelClass}>
                {t("cerca.perGregoriana")}
              </label>
              <input
                id="cerca-g"
                type="date"
                className={inputClass}
                value={gDate}
                onChange={(e) => setGDate(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="w-24">
                <label htmlFor="cerca-cy" className={labelClass}>
                  {t("cerca.anno")}
                </label>
                <input
                  id="cerca-cy"
                  inputMode="numeric"
                  className={inputClass}
                  value={cDate.year}
                  onChange={(e) =>
                    setCDate({ ...cDate, year: e.target.value.replace(/\D/g, "").slice(0, 4) })
                  }
                />
              </div>
              <div>
                <label htmlFor="cerca-cm" className={labelClass}>
                  {t("cerca.mese")}
                </label>
                <select
                  id="cerca-cm"
                  className={inputClass}
                  value={cDate.month}
                  onChange={(e) => setCDate({ ...cDate, month: e.target.value })}
                >
                  {COPTIC_MONTHS.map((m) => (
                    <option key={m.number} value={m.number}>
                      {m.number} · {m.translit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label htmlFor="cerca-cd" className={labelClass}>
                  {t("cerca.giorno")}
                </label>
                <input
                  id="cerca-cd"
                  inputMode="numeric"
                  className={inputClass}
                  value={cDate.day}
                  onChange={(e) =>
                    setCDate({ ...cDate, day: e.target.value.replace(/\D/g, "").slice(0, 2) })
                  }
                />
              </div>
            </>
          )}
          <button type="submit" className={secondaryButton}>
            <Search className="h-4 w-4" aria-hidden />
            {t("cerca.vai")}
          </button>
        </div>
        {searchError && (
          <p className="text-danger text-sm" role="alert">
            {t("cerca.nonValida")}
          </p>
        )}
      </form>

      {/* Giorno trovato e i suoi tre livelli */}
      <section className={`${cardClass} space-y-4`} aria-live="polite">
        <h2 className="text-foreground font-bold">
          {t("giorno", {
            copto: formatCoptic(info.coptic, locale, era),
            gregoriano: formatGregorian(info.gregorian, locale),
          })}
        </h2>
        {loadError && <p className="text-danger text-sm">{t("dbNonRaggiungibile")}</p>}
        <ul className="grid gap-3 md:grid-cols-3">
          {CONTENT_LEVELS.map((level) => {
            const existing = find(level, keys[level]);
            return (
              <li key={level} className="border-border rounded-lg border p-4">
                <p className="text-foreground text-sm font-semibold">{t(`livelli.${level}`)}</p>
                <p className="text-foreground/60 mt-1 text-xs">
                  {t(`livelliSpiega.${level}`, { chiave: keys[level] })}
                </p>
                <p className="mt-2 text-xs">
                  {all === null ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : existing ? (
                    <span
                      className={
                        existing.stato === "pubblicato" ? "badge-success" : "badge-neutral"
                      }
                    >
                      {t(existing.stato)}
                    </span>
                  ) : (
                    <span className="text-foreground/50">{t("nessunContenuto")}</span>
                  )}
                </p>
                <button
                  type="button"
                  className={`${secondaryButton} mt-3`}
                  onClick={() => setEditing({ level, key: keys[level], info })}
                >
                  {existing ? (
                    <Pencil className="h-4 w-4" aria-hidden />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden />
                  )}
                  {existing ? t("modifica") : t("aggiungi")}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {editing && (
        <ContentEditor
          key={`${editing.level}:${editing.key}`}
          level={editing.level}
          contentKey={editing.key}
          existing={find(editing.level, editing.key)}
          others={othersFor(editing.info)}
          info={editing.info}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {/* Elenco di tutti i contenuti */}
      <section className={cardClass}>
        <h2 className="text-foreground mb-3 font-bold">{t("tuttiContenuti")}</h2>
        {all === null ? (
          <Loader2 className="text-foreground/40 h-5 w-5 animate-spin" aria-hidden />
        ) : all.length === 0 ? (
          <p className="text-foreground/60 text-sm">{t("nessunSalvato")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-foreground/60 text-left text-xs uppercase">
                  <th className="py-2 pe-3">{t("stato")}</th>
                  <th className="py-2 pe-3">{t("colonne.livello")}</th>
                  <th className="py-2 pe-3">{t("colonne.chiave")}</th>
                  <th className="py-2 pe-3">{t("colonne.modifica")}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {all.map((c) => (
                  <tr key={c.id} className="border-border border-t">
                    <td className="py-2 pe-3">
                      <span
                        className={c.stato === "pubblicato" ? "badge-success" : "badge-neutral"}
                      >
                        {t(c.stato)}
                      </span>
                    </td>
                    <td className="py-2 pe-3">{t(`livelli.${c.livello}`)}</td>
                    <td className="py-2 pe-3 font-mono">{c.chiave}</td>
                    <td className="text-foreground/60 py-2 pe-3 text-xs">
                      {c.updatedBy} · {new Date(c.updatedAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="py-2 text-end">
                      <button
                        type="button"
                        className={secondaryButton}
                        onClick={() => openFromList(c)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        <span className="sr-only">{t("modifica")}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
