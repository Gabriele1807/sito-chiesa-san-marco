"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { canOfferInstall, promptInstall, useInstallState } from "./install-store";
import IosInstallSteps from "./IosInstallSteps";

const DISMISSED_KEY = "pwa_install_dismissed_at";
const VISITS_KEY = "pwa_visits";
const VISIT_COUNTED_KEY = "pwa_visit_counted";
const DISMISS_DAYS = 30;
// Né subito (disturberebbe chi arriva sul sito) né troppo tardi: 10 secondi
// alla prima visita, 3 a chi torna, oppure appena si apre una seconda pagina.
const FIRST_VISIT_DELAY_MS = 10_000;
const RETURNING_VISIT_DELAY_MS = 3_000;
const SECOND_PAGE_DELAY_MS = 1_500;

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // storage non disponibile: l'invito tornerà alla prossima visita
  }
}

/**
 * Invito discreto a installare l'app. Compare solo se il dispositivo lo
 * permette, dopo 10 secondi alla prima visita (3 a chi torna) o appena si
 * apre una seconda pagina; dopo "Non ora" resta nascosto per 30 giorni.
 */
export default function InstallPrompt() {
  const t = useTranslations("pwa");
  const install = useInstallState();
  const [engaged, setEngaged] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const dismissedAt = Number(safeGet(localStorage, DISMISSED_KEY) ?? 0);
    const recentlyDismissed = Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura da localStorage dopo l'idratazione
    setDismissed(recentlyDismissed);
    if (recentlyDismissed) return;

    let visits = Number(safeGet(localStorage, VISITS_KEY) ?? 0);
    if (!safeGet(sessionStorage, VISIT_COUNTED_KEY)) {
      visits += 1;
      safeSet(localStorage, VISITS_KEY, String(visits));
      safeSet(sessionStorage, VISIT_COUNTED_KEY, "1");
    }
    const delay = visits >= 2 ? RETURNING_VISIT_DELAY_MS : FIRST_VISIT_DELAY_MS;
    const timer = setTimeout(() => setEngaged(true), delay);
    return () => clearTimeout(timer);
  }, []);

  // Seconda pagina aperta nella stessa visita: l'interesse c'è, l'invito può comparire.
  const pathname = usePathname();
  const firstPath = useRef<string | null>(null);
  useEffect(() => {
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    if (pathname === firstPath.current) return;
    const timer = setTimeout(() => setEngaged(true), SECOND_PAGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (dismissed || !engaged || !canOfferInstall(install)) return null;

  function dismiss() {
    safeSet(localStorage, DISMISSED_KEY, String(Date.now()));
    setDismissed(true);
  }

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome !== "accepted") dismiss();
  }

  const isIos = install.platform === "ios-safari" || install.platform === "ios-other";

  return (
    <aside
      aria-labelledby="pwa-install-title"
      className="animate-fade-in-up border-border bg-surface fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-2xl border p-4 shadow-xl lg:inset-x-auto lg:end-6 lg:bottom-6 lg:mx-0 lg:w-[380px]"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="border-border h-12 w-12 shrink-0 rounded-xl border"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p id="pwa-install-title" className="text-foreground font-bold">
            {isIos ? t("iosTitle") : t("installTitle")}
          </p>
          {isIos ? (
            <IosInstallSteps notSafari={install.platform === "ios-other"} />
          ) : (
            <p className="text-foreground/70 text-sm leading-relaxed">
              {t(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "installBodyNotify" : "installBody")}
            </p>
          )}
          {!isIos && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleInstall}
                className="bg-accent hover:bg-accent-light rounded-full px-4 py-2 text-sm font-semibold text-white"
              >
                {t("installCta")}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="text-foreground/60 hover:text-foreground rounded-full px-3 py-2 text-sm"
              >
                {t("installLater")}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-foreground/50 hover:bg-foreground/5 hover:text-foreground -me-1 -mt-1 rounded-full p-1.5"
          aria-label={t("installClose")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
