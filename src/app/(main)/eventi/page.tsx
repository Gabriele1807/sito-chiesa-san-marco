import { getTranslations } from "next-intl/server";
import { getEventi } from "@/lib/db";
import EventiList from "@/components/EventiList";
import AdminGate from "@/components/auth/AdminGate";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";

export const revalidate = 60;

export default async function EventiPage() {
  const [t, eventi] = await Promise.all([getTranslations("eventi"), getEventi()]);

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

      <EventiList eventi={eventi} />
    </div>
  );

  return (
    <SectionVisibilityGate sectionId="eventi" title={t("titolo")}>
      <AdminGate title={t("titolo")}>
        {content}
      </AdminGate>
    </SectionVisibilityGate>
  );
}
