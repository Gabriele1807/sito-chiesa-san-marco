"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { deviceTimeZone, localJdn } from "@/lib/calendario/tz";
import { nowMs } from "@/components/calendario/useLiveClock";
import ContenutiTab from "@/components/admin/calendario/ContenutiTab";
import FesteTab from "@/components/admin/calendario/FesteTab";
import RegoleTab from "@/components/admin/calendario/RegoleTab";
import ImpostazioniTab, {
  type ImpostazioniData,
} from "@/components/admin/calendario/ImpostazioniTab";
import { configFrom, type FestaFissa, type RegolaView } from "@/components/admin/calendario/shared";

const TABS = ["contenuti", "feste", "regole", "impostazioni"] as const;
type Tab = (typeof TABS)[number];

export default function AdminCalendarioPage() {
  const t = useTranslations("adminCalendario");
  const [tab, setTab] = useState<Tab>("contenuti");
  const [feste, setFeste] = useState<FestaFissa[] | null>(null);
  const [regole, setRegole] = useState<RegolaView[] | null>(null);
  const [impostazioni, setImpostazioni] = useState<ImpostazioniData | null>(null);
  const [dbError, setDbError] = useState(false);
  const [todayJdn] = useState(() => localJdn(nowMs(), deviceTimeZone()));

  const load = useCallback(async () => {
    const [f, r, i] = await Promise.all([
      adminFetch("/api/admin/calendario/feste"),
      adminFetch("/api/admin/calendario/regole"),
      adminFetch("/api/admin/calendario/impostazioni"),
    ]);
    setDbError(!f.ok || !r.ok || !i.ok);
    setFeste(f.ok ? await f.json() : []);
    setRegole(r.ok ? await r.json() : []);
    setImpostazioni(i.ok ? await i.json() : null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale dal server
    load();
  }, [load]);

  const config = useMemo(() => configFrom(feste ?? [], regole ?? []), [feste, regole]);

  if (!feste || !regole) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-foreground/40 h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">{t("titolo")}</h1>
        <p className="text-foreground/60 mt-1 text-sm">{t("sottotitolo")}</p>
      </div>

      {dbError && (
        <p
          className="text-danger border-danger/30 bg-danger/5 rounded-lg border px-4 py-2 text-sm"
          role="alert"
        >
          {t("dbNonRaggiungibile")}
        </p>
      )}

      <div
        role="tablist"
        aria-label={t("titolo")}
        className="border-border flex flex-wrap gap-1 border-b"
      >
        {TABS.map((id) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const i = TABS.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1);
              const next = TABS[(i + TABS.length) % TABS.length];
              setTab(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
            className={`focus-visible:ring-gold -mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              tab === id
                ? "border-gold text-foreground"
                : "text-foreground/60 hover:text-foreground border-transparent"
            }`}
          >
            {t(`schede.${id}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "contenuti" && <ContenutiTab config={config} todayJdn={todayJdn} />}
        {tab === "feste" && <FesteTab feste={feste} onChange={load} />}
        {tab === "regole" && <RegoleTab regole={regole} onChange={load} />}
        {tab === "impostazioni" && impostazioni && (
          <ImpostazioniTab
            key={impostazioni.updatedAt ?? "default"}
            data={impostazioni}
            onChange={load}
          />
        )}
      </div>
    </div>
  );
}
