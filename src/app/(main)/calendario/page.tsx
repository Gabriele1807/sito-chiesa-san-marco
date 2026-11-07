import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import CalendarioCopto from "@/components/calendario/CalendarioCopto";
import { getCalendarConfigSafe, CALENDARIO_TIMEOUT_MS } from "@/lib/calendario-data";
import { CALENDARIO_SECTION_ID } from "@/lib/mongo/calendario";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("calendario", "titolo", "sottotitolo", "/calendario");
}

export default async function CalendarioPage() {
  // Feste, regole impostate e località predefinita dal database; se non
  // risponde si usano i valori del codice: la data resta sempre corretta.
  const [t, { data: config }] = await Promise.all([
    getTranslations("calendario"),
    getCalendarConfigSafe(),
  ]);

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
        <CalendarioCopto initialConfig={config} />
      </div>
    </SectionVisibilityGate>
  );
}
