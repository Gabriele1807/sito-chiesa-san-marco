import { getTranslations } from "next-intl/server";
import { getIcone } from "@/lib/db";
import IconeGrid from "@/components/IconeGrid";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";

export const revalidate = 60;

export default async function IconePage() {
  const [t, icone] = await Promise.all([getTranslations("icone"), getIcone()]);

  const content = (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-fade-in-up">
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
