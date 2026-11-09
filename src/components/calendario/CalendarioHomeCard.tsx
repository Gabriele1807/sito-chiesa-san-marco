"use client";

import Link from "next/link";
import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange } from "lucide-react";
import { copticToday, nextLocalMidnight } from "@/lib/calendario/today";
import { useSectionAccess } from "@/components/useSectionAccess";
import { useLiveClock, type ClockSnapshot } from "./useLiveClock";
import { formatCoptic } from "./format";

/** Id della sezione in `section_visibility` (come in sidebar/nav-config.ts). */
const SECTION_ID = "calendario";

/**
 * Altezza fissa in ogni stato (caricamento, visibile, nascosta): la card è
 * nell'hero e non deve spostare ciò che sta sotto.
 */
const SLOT = "h-[8rem]";
const FRAME =
  "rounded-[1.75rem] border border-accent/40 bg-gradient-to-br from-surface to-surface-2 shadow-sm sm:rounded-3xl";

/** "30 Baba 1743 A.M." del giorno civile, o null se il calcolo non riesce. */
function todayLabel(clock: ClockSnapshot, locale: string, era: string): string | null {
  try {
    return formatCoptic(copticToday(clock.now, clock.timeZone).coptic, locale, era);
  } catch {
    return null;
  }
}

/**
 * Collegamento compatto al calendario copto, con la data copta di oggi.
 * La data è calcolata solo nel browser (sul server c'è lo scheletro) e non
 * dipende dal database; l'orologio programma un solo timer, a mezzanotte.
 */
export default function CalendarioHomeCard() {
  const t = useTranslations("calendario");
  const locale = useLocale();
  const id = useId();
  const access = useSectionAccess(SECTION_ID);
  const clock = useLiveClock(true, nextLocalMidnight);

  if (access === null) {
    return (
      <div className={`${SLOT} ${FRAME} flex items-center gap-4 px-5`} aria-hidden>
        <div className="bg-surface-2 h-11 w-11 shrink-0 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="bg-surface-2 h-3 w-28 animate-pulse rounded" />
          <div className="bg-surface-2 h-4 w-40 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Sezione nascosta dalle impostazioni: si tiene lo spazio, senza contenuto.
  if (access !== "full") return <div className={SLOT} aria-hidden />;

  const today = clock ? todayLabel(clock, locale, t("annoMartiri")) : undefined;

  return (
    <div
      className={`${SLOT} ${FRAME} animate-fade-in-up relative flex items-center gap-4 px-5 transition-shadow hover:shadow-md`}
      style={{ animationDelay: "200ms" }}
    >
      <div className="border-accent/40 flex h-11 w-11 shrink-0 items-center justify-center border">
        <CalendarRange className="text-accent h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="eyebrow">
          <Link
            href="/calendario"
            aria-describedby={`${id}-desc`}
            className="focus-visible:after:ring-gold after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-offset-2 sm:after:rounded-3xl"
          >
            {t("home.titolo")}
          </Link>
        </h3>
        <div id={`${id}-desc`}>
          {today === undefined ? (
            <div className="bg-surface-2 mt-1.5 h-5 w-44 animate-pulse rounded" aria-hidden />
          ) : (
            today && (
              <p className="font-display text-foreground mt-1 truncate text-lg leading-snug">
                {t("home.oggi", { data: today })}
              </p>
            )
          )}
          <p className="text-foreground/60 mt-0.5 truncate text-xs">{t("home.descrizione")}</p>
        </div>
        {/* Secondo collegamento sopra il link "esteso" della card. */}
        <Link
          href="/calendario/feste"
          className="text-accent hover:text-accent/80 focus-visible:ring-gold relative z-10 mt-1 inline-flex min-h-6 items-center gap-1 rounded text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          {t("festeAnno.titolo")}
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            →
          </span>
        </Link>
      </div>
      <span aria-hidden className="text-accent inline-block shrink-0 text-lg rtl:-scale-x-100">
        →
      </span>
    </div>
  );
}
