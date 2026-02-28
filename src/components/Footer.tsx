import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("common");
  return (
    <footer className="bg-gray-900 text-gray-400 py-6">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">☦</span>
            </div>
            <span className="text-sm">
              Chiesa Copta Ortodossa di San Marco – Milano
            </span>
          </div>
          <p className="text-xs">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
