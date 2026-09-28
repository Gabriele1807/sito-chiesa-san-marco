import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getActiveAvvisi } from "@/lib/db";
import AvvisoItem from "./AvvisoItem";
import { toAvvisoViews } from "./avvisi-view";

const HOME_LIMIT = 3;

/** Bacheca avvisi in home: compare solo se c'è almeno un avviso attivo. */
export default async function AvvisiHomeSection() {
  const avvisi = await getActiveAvvisi();
  if (avvisi.length === 0) return null;

  const [t, views] = await Promise.all([
    getTranslations("avvisi"),
    toAvvisoViews(avvisi.slice(0, HOME_LIMIT)),
  ]);

  return (
    <section
      id="avvisi"
      aria-labelledby="avvisi-title"
      className="animate-fade-in-up mt-10 sm:mt-12"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="avvisi-title" className="font-display text-foreground mt-2 text-2xl sm:text-3xl">
            {t("titolo")}
          </h2>
        </div>
        <Link
          href="/avvisi"
          className="text-accent inline-flex min-h-10 items-center text-sm font-semibold hover:underline"
        >
          {t("vediTutti")}
          {avvisi.length > HOME_LIMIT ? ` (${avvisi.length})` : ""}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {views.map((view) => (
          <AvvisoItem key={view.id} avviso={view} />
        ))}
      </div>
    </section>
  );
}
