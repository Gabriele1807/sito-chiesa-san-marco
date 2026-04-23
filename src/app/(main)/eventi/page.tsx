import { getTranslations } from "next-intl/server";
import { getEventi } from "@/lib/db";
import EventiList from "@/components/EventiList";
import RestrictedSection from "@/components/auth/RestrictedSection";

export const revalidate = 60;

export default async function EventiPage() {
  const [t, eventi] = await Promise.all([getTranslations("eventi"), getEventi()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 animate-fade-in-up">
          {t("titolo")}
        </h1>
        <p className="text-gray-600 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">
          {t("sottotitolo")}
        </p>
      </div>

      <RestrictedSection message="Per accedere agli eventi e alle prenotazioni registrati o accedi">
        <EventiList eventi={eventi} />
      </RestrictedSection>
    </div>
  );
}
