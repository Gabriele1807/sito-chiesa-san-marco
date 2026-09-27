import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getActiveAvvisi } from "@/lib/db";
import AvvisoItem from "@/components/avvisi/AvvisoItem";
import { toAvvisoViews } from "@/components/avvisi/avvisi-view";
import PushToggle from "@/components/pwa/PushToggle";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("avvisi", "titolo", "sottotitolo", "/avvisi");
}

export default async function AvvisiPage() {
  const [t, avvisi] = await Promise.all([getTranslations("avvisi"), getActiveAvvisi()]);
  const views = await toAvvisoViews(avvisi);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-display text-foreground mt-2 text-3xl sm:text-4xl">{t("titolo")}</h1>
        <p className="text-foreground/70 mt-2 text-sm leading-relaxed">{t("sottotitolo")}</p>
      </header>

      <PushToggle />

      {views.length === 0 ? (
        <div className="border-border bg-surface rounded-2xl border px-6 py-14 text-center">
          <Megaphone className="text-foreground/30 mx-auto mb-3 h-8 w-8" aria-hidden />
          <p className="text-foreground/60 text-sm">{t("nessuno")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {views.map((view) => (
            <AvvisoItem key={view.id} avviso={view} />
          ))}
        </div>
      )}
    </div>
  );
}
