import { getLocale, getTranslations } from "next-intl/server";
import { localizeAvviso, type Avviso } from "@/lib/mongo/announcements";
import type { AvvisoView } from "./AvvisoItem";

/** Converte gli avvisi nel formato mostrato, nella lingua della richiesta. */
export async function toAvvisoViews(avvisi: Avviso[]): Promise<AvvisoView[]> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("avvisi")]);
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "it-IT", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Rome",
  });

  return avvisi.map((avviso) => {
    const { titolo, messaggio } = localizeAvviso(avviso, locale);
    return {
      id: avviso.id,
      titolo,
      messaggio,
      livello: avviso.livello,
      link: avviso.link || undefined,
      levelLabel: t(`livello_${avviso.livello}`),
      meta: avviso.scadenza
        ? t("validoFino", { date: dateFormat.format(new Date(avviso.scadenza)) })
        : t("pubblicatoIl", {
            date: dateFormat.format(new Date(avviso.inizio || avviso.createdAt)),
          }),
      linkLabel: t("apri"),
    };
  });
}
