import type { Metadata } from "next";
import Link from "next/link";
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
          <Link
            href="/calendario/feste"
            className="text-accent hover:text-accent/80 focus-visible:ring-gold mt-3 inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("festeAnno.titolo")}
            <span aria-hidden className="inline-block rtl:-scale-x-100">
              →
            </span>
          </Link>
        </header>
        <CalendarioCopto
          key={initialDate ?? "live"}
          initialConfig={config}
          initialDate={initialDate}
        />
      </div>
    </SectionVisibilityGate>
  );
}
