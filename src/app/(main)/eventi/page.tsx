import { getTranslations } from "next-intl/server";
import { getEventi } from "@/lib/db";
import EventiList from "@/components/EventiList";

export const dynamic = "force-dynamic";

export default async function EventiPage() {
  const t = await getTranslations("eventi");
  const eventi = await getEventi();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {t("titolo")}
        </h1>
        <p className="text-gray-600 leading-relaxed max-w-2xl">
          {t("sottotitolo")}
        </p>
      </div>

      <EventiList eventi={eventi} />
    </div>
  );
}
