import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import FesteAnno from "@/components/calendario/FesteAnno";
import { getCalendarConfigSafe, CALENDARIO_TIMEOUT_MS } from "@/lib/calendario-data";
import { CALENDARIO_SECTION_ID } from "@/lib/mongo/calendario";
import { parseCopticYearParam } from "@/lib/calendario/params";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata(
    "calendario",
    "festeAnno.titolo",
    "festeAnno.sottotitolo",
    "/calendario/feste"
  );
}

export default async function FesteAnnoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Feste fisse e regole dal database; se non risponde, i valori del codice.
  const [t, { data: config }, params] = await Promise.all([
    getTranslations("calendario"),
    getCalendarConfigSafe(),
    searchParams,
  ]);

  return (
    <SectionVisibilityGate
      sectionId={CALENDARIO_SECTION_ID}
      title={t("festeAnno.titolo")}
      timeoutMs={CALENDARIO_TIMEOUT_MS}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-display text-foreground mt-2 text-3xl sm:text-4xl">
            {t("festeAnno.titolo")}
          </h1>
          <p className="text-foreground/70 mt-2 text-sm leading-relaxed">
            {t("festeAnno.sottotitolo")}
          </p>
          <Link
            href="/calendario"
            className="text-accent hover:text-accent/80 focus-visible:ring-gold mt-3 inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            <span aria-hidden className="inline-block rtl:-scale-x-100">
              ←
            </span>
            {t("festeAnno.vaiCalendario")}
          </Link>
        </header>
        <FesteAnno initialConfig={config} initialYear={parseCopticYearParam(params.anno)} />
      </div>
    </SectionVisibilityGate>
  );
}
