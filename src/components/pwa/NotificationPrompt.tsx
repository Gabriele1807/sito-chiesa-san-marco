"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BellRing, Loader2, X } from "lucide-react";
import { useInstallState } from "./install-store";
import { currentPushSubscription, pushSupported, subscribeToPush } from "./push-client";

const DISMISSED_KEY = "pwa_push_prompt_dismissed_at";
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 3_000;

/**
 * Invito ad attivare le notifiche degli avvisi, mostrato solo dentro l'app
 * installata (su iPhone le notifiche esistono solo lì) e solo se il
 * permesso non è ancora stato chiesto. Il permesso viene chiesto dal tocco
 * su "Attiva notifiche", come richiedono i browser. Dopo "Non ora" torna
 * dopo 14 giorni; se il permesso è stato negato non compare più.
 */
export default function NotificationPrompt() {
  const t = useTranslations("pwa");
  const locale = useLocale();
  const install = useInstallState();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!install.standalone || !pushSupported() || Notification.permission !== "default") return;
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    } catch {
      // storage non disponibile: l'invito può comparire
    }
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const existing = await currentPushSubscription().catch(() => null);
      if (!cancelled && !existing) setVisible(true);
    }, SHOW_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [install.standalone]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // storage non disponibile: resta nascosto solo in questa sessione
    }
    setVisible(false);
  }

  async function enable() {
    setBusy(true);
    setError(false);
    try {
      const permission = await subscribeToPush(locale);
      if (permission === "granted") {
        setDone(true);
        setTimeout(() => setVisible(false), 4000);
      } else {
        // Negato o chiuso senza scegliere: non si insiste.
        dismiss();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      aria-labelledby="pwa-notify-title"
      className="animate-fade-in-up border-border bg-surface fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-2xl border p-4 shadow-xl lg:inset-x-auto lg:end-6 lg:bottom-6 lg:mx-0 lg:w-[380px]"
    >
      <div className="flex items-start gap-3">
        <div className="bg-accent/10 text-accent rounded-full p-2">
          <BellRing className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {done ? (
            <p role="status" className="text-foreground/80 text-sm">
              {t("notifyDone")}
            </p>
          ) : (
            <>
              <p id="pwa-notify-title" className="text-foreground font-bold">
                {t("notifyTitle")}
              </p>
              <p className="text-foreground/70 text-sm leading-relaxed">{t("notifyBody")}</p>
              {error && (
                <p role="alert" className="text-danger text-sm">
                  {t("pushError")}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={enable}
                  disabled={busy}
                  className="bg-accent hover:bg-accent-light inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {t("notifyEnable")}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-foreground/60 hover:text-foreground rounded-full px-3 py-2 text-sm"
                >
                  {t("notifyLater")}
                </button>
              </div>
            </>
          )}
        </div>
        {!done && (
          <button
            type="button"
            onClick={dismiss}
            className="text-foreground/50 hover:bg-foreground/5 hover:text-foreground -me-1 -mt-1 rounded-full p-1.5"
            aria-label={t("installClose")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
