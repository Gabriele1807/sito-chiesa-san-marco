"use client";

import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Loader2 } from "lucide-react";
import {
  READING_IDS,
  type DayContent,
  type DayContentBundle,
  type LocalizedText,
} from "@/lib/calendario/content";
import { localized } from "./format";

interface Section {
  id: string;
  label: string;
  text: string;
}

/** Unisce i livelli (fisso, mobile, stagionale) in un elenco di sezioni nell'ordine liturgico. */
function sectionsOf(bundle: DayContentBundle, locale: string, label: (k: string) => string) {
  const levels = [bundle.movable, bundle.seasonal, bundle.fixed].filter(Boolean) as DayContent[];
  const pick = (get: (c: DayContent) => LocalizedText | undefined) =>
    levels
      .map((c) => localized(get(c), locale))
      .filter(Boolean)
      .join("\n\n");

  const sections: Section[] = [];
  const push = (id: string, text: string) => {
    if (text) sections.push({ id, label: label(id), text });
  };
  push(
    "sinassario",
    pick((c) => c.sinassario)
  );
  for (const id of READING_IDS)
    push(
      id,
      pick((c) => c.letture?.[id])
    );
  push(
    "note",
    pick((c) => c.note)
  );
  return sections;
}

export default function DayReadings({
  bundle,
  loading,
}: {
  bundle: DayContentBundle | null;
  loading?: boolean;
}) {
  const t = useTranslations("calendario.letture");
  const locale = useLocale();

  if (loading) {
    return (
      <div className="empty-state flex items-center justify-center gap-2" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("caricamento")}
      </div>
    );
  }

  const sections = bundle?.available ? sectionsOf(bundle, locale, (k) => t(k)) : [];

  if (sections.length === 0) {
    return (
      <div className="empty-state">
        <BookOpen className="text-foreground/30 mx-auto mb-3 h-8 w-8" aria-hidden />
        <p className="text-foreground/80 font-semibold">{t("inArrivo")}</p>
        <p className="mt-1">{t("inArrivoSpiega")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <section key={s.id} className="border-border bg-surface rounded-2xl border px-5 py-4">
          <h3 className="font-display text-foreground text-xl">{s.label}</h3>
          <p className="text-foreground/80 mt-2 text-sm leading-relaxed whitespace-pre-line">
            {s.text}
          </p>
        </section>
      ))}
    </div>
  );
}
