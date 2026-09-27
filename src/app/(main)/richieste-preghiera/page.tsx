import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import PrayerRequestForm from "@/components/prayer/PrayerRequestForm";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("richiestePreghiera", "titolo", "sottotitolo", "/richieste-preghiera");
}

export default async function RichiestePreghieraPage() {
  const t = await getTranslations("richiestePreghiera");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-display text-foreground mt-2 text-3xl sm:text-4xl">{t("titolo")}</h1>
        <p className="text-foreground/70 mt-2 text-sm leading-relaxed">{t("sottotitolo")}</p>
        <p className="text-foreground/55 mt-3 inline-flex items-start gap-2 text-xs">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("privacyNota")}
        </p>
      </header>
      <PrayerRequestForm />
    </div>
  );
}
