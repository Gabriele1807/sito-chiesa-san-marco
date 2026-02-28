import { getTranslations } from "next-intl/server";
import { Church, Users, Heart, BookOpen } from "lucide-react";

export default async function ChiSiamoPage() {
  const t = await getTranslations("chiSiamo");

  const timelineSteps = [
    { key: "step1", icon: Church },
    { key: "step2", icon: BookOpen },
    { key: "step3", icon: Heart },
    { key: "step4", icon: Users },
  ] as const;

  return (
    <div className="space-y-16">
      {/* Intro */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
          {t("titolo")}
        </h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {t("intro")}
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-primary/5 rounded-xl p-5">
                  <h3 className="font-bold text-primary mb-2">{t("missioneTitolo")}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t("missione")}
                  </p>
                </div>
                <div className="bg-accent/5 rounded-xl p-5">
                  <h3 className="font-bold text-accent mb-2">{t("comunitaTitolo")}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t("comunita")}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-72 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <Church className="w-20 h-20 text-gray-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{t("storia")}</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary/30 hidden sm:block" />

          <div className="space-y-8">
            {timelineSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-6 items-start">
                  {/* Icon circle */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {/* Content */}
                  <div className="card-hover bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {index + 1}
                      </span>
                      <h3 className="font-bold text-gray-900">
                        {t(`${step.key}Titolo` as "step1Titolo" | "step2Titolo" | "step3Titolo" | "step4Titolo")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t(step.key)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Images placeholder */}
      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["La nostra chiesa", "La comunità", "Liturgia"].map((label) => (
            <div
              key={label}
              className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center"
            >
              <span className="text-sm text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
