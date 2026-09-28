"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { AvvisoLink } from "./AvvisoItem";

export interface UrgentAvviso {
  /** id + data di modifica: un avviso nascosto ricompare se viene aggiornato. */
  key: string;
  titolo: string;
  messaggio: string;
  link?: string;
}

const STORAGE_KEY = "avvisi_nascosti";

function readDismissed(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Striscia in cima a tutte le pagine pubbliche per gli avvisi "urgenti".
 * Ogni visitatore può nasconderla; la scelta resta nel browser.
 */
export default function UrgentAvvisiBanner({ avvisi }: { avvisi: UrgentAvviso[] }) {
  const t = useTranslations("avvisi");
  // null = non ancora letto (prima dell'idratazione): nessun banner, così
  // server e client producono lo stesso HTML e non c'è "lampeggio" per chi
  // l'aveva già nascosto.
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura da localStorage dopo l'idratazione
    setDismissed(readDismissed());
  }, []);

  if (dismissed === null) return null;
  const visible = avvisi.filter((a) => !dismissed.includes(a.key));
  if (visible.length === 0) return null;

  function dismiss(key: string) {
    // Tiene solo le chiavi degli avvisi ancora attivi: la lista non cresce all'infinito.
    const next = [...(dismissed ?? []).filter((k) => avvisi.some((a) => a.key === k)), key];
    setDismissed(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage non disponibile (navigazione privata): resta nascosto solo in questa pagina
    }
  }

  return (
    <div className="mb-5 space-y-2" role="region" aria-label={t("titolo")}>
      {visible.map((avviso) => (
        <div
          key={avviso.key}
          role="alert"
          className="border-danger/30 bg-danger/[0.07] flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
        >
          <AlertTriangle className="text-danger mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-bold">{avviso.titolo}</p>
            <p className="text-foreground/75 line-clamp-3 whitespace-pre-line">
              {avviso.messaggio}
            </p>
            {avviso.link && (
              <AvvisoLink
                href={avviso.link}
                className="text-danger mt-1 inline-block font-semibold hover:underline"
              >
                {t("apri")}
              </AvvisoLink>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(avviso.key)}
            className="text-foreground/60 hover:bg-danger/10 hover:text-foreground focus-visible:ring-gold -me-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label={t("chiudi")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
