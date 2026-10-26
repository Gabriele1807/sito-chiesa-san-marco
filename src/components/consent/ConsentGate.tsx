"use client";

import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { openConsentPreferences, saveConsent, useConsent } from "@/lib/consent";

interface ConsentGateProps {
  /** Nome del servizio mostrato all'utente, es. "Google Maps". */
  service: string;
  /** Dove aprire il contenuto senza incorporarlo (nessun consenso necessario). */
  href?: string;
  /** Il contenuto di terze parti: viene montato solo dopo il consenso. */
  children: ReactNode;
  className?: string;
}

/**
 * Mostra il contenuto di terze parti solo se l'utente ha acconsentito;
 * altrimenti un segnaposto che spiega perché e offre le alternative
 * (consentire, aprire il servizio in una nuova scheda, gestire le preferenze).
 */
export default function ConsentGate({ service, href, children, className }: ConsentGateProps) {
  const t = useTranslations("cookieBanner");
  const consent = useConsent();

  if (consent.status !== "unknown" && consent.thirdParty) return <>{children}</>;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-2/70 p-4 text-center ${className ?? ""}`}
    >
      <ShieldCheck className="h-7 w-7 text-accent" aria-hidden />
      <p className="max-w-sm text-sm leading-relaxed text-foreground/75">
        {t("gateText", { service })}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => saveConsent({ thirdParty: true })}
          className="btn-primary min-h-10"
        >
          {t("gateAccept")}
        </button>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-10">
            {t("gateOpen", { service })}
          </a>
        )}
      </div>
      <button type="button" onClick={openConsentPreferences} className="btn-link min-h-8 text-xs">
        {t("gateManage")}
      </button>
    </div>
  );
}
