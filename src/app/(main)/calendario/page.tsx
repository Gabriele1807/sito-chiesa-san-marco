import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import CalendarioCopto from "@/components/calendario/CalendarioCopto";
import { getCalendarConfigSafe, CALENDARIO_TIMEOUT_MS } from "@/lib/calendario-data";
import { CALENDARIO_SECTION_ID } from "@/lib/mongo/calendario";
import { parseDateParam } from "@/lib/calendario/params";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("calendario", "titolo", "sottotitolo", "/calendario");
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Feste, regole impostate e località predefinita dal database; se non
  // risponde si usano i valori del codice: la data resta sempre corretta.
  const [t, { data: config }, params] = await Promise.all([
    getTranslations("calendario"),
    getCalendarConfigSafe(),
    searchParams,
  ]);
  // ?data=AAAA-MM-GG (es. dall'elenco delle feste): apre in Manuale su quel giorno.
  const initialDate = parseDateParam(params.data);

  return (
    <SectionVisibilityGate
      sectionId={CALENDARIO_SECTION_ID}
      title={t("titolo")}
      timeoutMs={CALENDARIO_TIMEOUT_MS}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-display text-foreground mt-2 text-3xl sm:text-4xl">{t("titolo")}</h1>
          <p className="text-foreground/70 mt-2 text-sm leading-relaxed">{t("sottotitolo")}</p>
        </header>
        {/* Accesso ben visibile all'elenco delle feste, per chi apre il calendario. */}
        <Link
          href="/calendario/feste"
          className="border-accent/40 from-surface to-surface-2 focus-visible:ring-gold group flex items-center gap-4 rounded-2xl border bg-gradient-to-br px-5 py-4 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span className="border-accent/40 flex h-11 w-11 shrink-0 items-center justify-center border">
            <CalendarHeart className="text-accent h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-foreground block font-semibold">{t("festeAnno.cta")}</span>
            <span className="text-foreground/60 mt-0.5 block text-xs leading-relaxed">
              {t("festeAnno.ctaDescrizione")}
            </span>
          </span>
          <span
            aria-hidden
            className="text-accent inline-block shrink-0 text-lg transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          >
            →
          </span>
        </Link>
        <CalendarioCopto
          key={initialDate ?? "live"}
          initialConfig={config}
          initialDate={initialDate}
        />
      </div>
    </SectionVisibilityGate>
  );
}
