import { getTranslations } from "next-intl/server";
import { getOrari } from "@/lib/db";
import { Clock, CalendarDays, Sparkles } from "lucide-react";
import NextCelebrationCard from "@/components/NextCelebrationCard";
import OrariTable from "@/components/OrariTable";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";

export const revalidate = 60;

export default async function OrariPage() {
  const [t, tHome, orari] = await Promise.all([
    getTranslations("orari"),
    getTranslations("home"),
    getOrari(),
  ]);

  const totalCelebrazioni = orari.reduce((count, giorno) => count + giorno.celebrazioni.length, 0);

  const content = (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Clock className="w-3.5 h-3.5" />
          Orari settimanali
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground animate-fade-in-up">
            {t("titolo")}
          </h1>
          <p className="text-foreground/70 leading-relaxed animate-fade-in-up [animation-delay:100ms]">
            {t("sottotitolo")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up [animation-delay:150ms]">
          <div className="rounded-2xl border border-accent/15 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{orari.length}</p>
                <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Giorni attivi</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-accent/15 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{totalCelebrazioni}</p>
                <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Celebrazioni</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-accent/15 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Live</p>
                <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Aggiornamento ogni minuto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden animate-fade-in-up [animation-delay:200ms]">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-surface-alt/70">
            <div>
              <h2 className="text-base font-bold text-foreground">Calendario settimanale</h2>
              <p className="text-sm text-foreground/50">Tutti gli orari della liturgia disponibili in settimana</p>
            </div>
          </div>

          <OrariTable
            orari={orari}
            labels={{
              giorno: t("giorno"),
              celebrazione: t("celebrazione"),
              orario: t("orario"),
              note: t("note"),
            }}
          />
        </div>

        <div className="space-y-6 animate-fade-in-up [animation-delay:250ms]">
          <NextCelebrationCard
            orari={orari}
            title={tHome("quickProssima")}
            emptyLabel={tHome("noCelebration")}
          />
          <div className="rounded-3xl border border-gold/15 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-2">Come leggere gli orari</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Gli orari sono aggiornati settimanalmente. Se un giorno contiene più celebrazioni, le trovi raggruppate sotto lo stesso giorno con eventuali note in evidenza.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full bg-primary flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600">Orario della celebrazione</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full bg-accent flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600">Elemento evidenziato</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SectionVisibilityGate sectionId="orari" title={t("titolo")}>
      {content}
    </SectionVisibilityGate>
  );
}
