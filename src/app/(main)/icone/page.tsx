import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getIcone } from "@/lib/db";
import IconeGrid from "@/components/IconeGrid";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("icone", "titolo", "sottotitolo", "/icone");
}

export default async function IconePage() {
  const [t, icone] = await Promise.all([getTranslations("icone"), getIcone()]);

  const content = (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2 animate-fade-in-up">{t("titolo")}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3 animate-fade-in-up">
          {t("titolo")}
        </h1>
        <p className="text-foreground/60 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">
          {t("sottotitolo")}
        </p>
      </div>

      <IconeGrid icone={icone} />
    </div>
  );

  return (
    <SectionVisibilityGate sectionId="icone" title={t("titolo")}>
      {content}
    </SectionVisibilityGate>
  );
}
