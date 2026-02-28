import { getTranslations } from "next-intl/server";
import { getIcone } from "@/lib/db";
import IconeGrid from "@/components/IconeGrid";

export const dynamic = "force-dynamic";

export default async function IconePage() {
  const t = await getTranslations("icone");
  const icone = await getIcone();

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

      <IconeGrid icone={icone} />
    </div>
  );
}
