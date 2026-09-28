"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useInstallState } from "./install-store";
import IosInstallSteps from "./IosInstallSteps";
import { VAPID_PUBLIC_KEY, subscribeToPush, unsubscribeFromPush } from "./push-client";

type Status = "checking" | "unsupported" | "ios-install" | "denied" | "off" | "on";

/**
 * Attiva/disattiva le notifiche degli avvisi su questo dispositivo.
 * Non compare se le chiavi VAPID non sono configurate.
 */
export default function PushToggle() {
  const t = useTranslations("pwa");
  const locale = useLocale();
  const install = useInstallState();
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      // iOS < 16.4 o Safari non installato: su iPhone la risposta giusta è "installa l'app".
      setStatus(
        install.platform === "ios-safari" || install.platform === "ios-other"
          ? "ios-install"
          : "unsupported"
      );
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      setStatus("unsupported");
      return;
    }
    const subscription = await registration.pushManager.getSubscription();
    setStatus(subscription && Notification.permission === "granted" ? "on" : "off");
  }, [install.platform]);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    refresh().catch(() => setStatus("unsupported"));
  }, [refresh]);

  if (!VAPID_PUBLIC_KEY || status === "checking") return null;

  async function enable() {
    setBusy(true);
    setError("");
    try {
      const permission = await subscribeToPush(locale);
      setStatus(permission === "granted" ? "on" : permission === "denied" ? "denied" : "off");
    } catch {
      setError(t("pushError"));
      await refresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError("");
    try {
      await unsubscribeFromPush();
      setStatus("off");
    } catch {
      setError(t("pushError"));
    } finally {
      setBusy(false);
    }
  }

  const Icon =
    status === "on" ? BellRing : status === "denied" || status === "unsupported" ? BellOff : Bell;

  return (
    <section
      aria-labelledby="push-toggle-title"
      className="border-border bg-surface rounded-2xl border p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-full p-2 ${status === "on" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 id="push-toggle-title" className="text-foreground font-bold">
            {t("pushTitle")}
          </h2>

          {status === "unsupported" && (
            <p className="text-foreground/70 text-sm">{t("pushUnsupported")}</p>
          )}
          {status === "denied" && <p className="text-foreground/70 text-sm">{t("pushDenied")}</p>}
          {status === "ios-install" && (
            <>
              <p className="text-foreground/70 text-sm">{t("pushIosInstall")}</p>
              <IosInstallSteps notSafari={install.platform === "ios-other"} />
            </>
          )}
          {(status === "off" || status === "on") && (
            <>
              <p className="text-foreground/70 text-sm">
                {status === "on" ? t("pushEnabled") : t("pushBody")}
              </p>
              <button
                type="button"
                onClick={status === "on" ? disable : enable}
                disabled={busy}
                className={
                  status === "on"
                    ? "border-border text-foreground/80 hover:bg-background inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    : "bg-accent hover:bg-accent-light inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                }
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {status === "on" ? t("pushDisable") : t("pushEnable")}
              </button>
            </>
          )}
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
