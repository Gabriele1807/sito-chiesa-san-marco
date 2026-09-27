"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useInstallState } from "./install-store";
import IosInstallSteps from "./IosInstallSteps";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Status = "checking" | "unsupported" | "ios-install" | "denied" | "off" | "on";

/** Chiave VAPID (base64url) → formato richiesto da pushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameKey(subscription: PushSubscription): boolean {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;
  const expected = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const actual = new Uint8Array(current);
  return actual.length === expected.length && actual.every((b, i) => b === expected[i]);
}

/**
 * Il browser contatta il proprio servizio push (Google, Mozilla, Apple) per
 * creare l'iscrizione: se non risponde la promessa può restare in attesa
 * per sempre, lasciando il pulsante bloccato sulla rotellina.
 */
const SUBSCRIBE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("push subscribe timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function saveOnServer(subscription: PushSubscription, locale: string): Promise<boolean> {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), locale }),
  });
  return res.ok;
}

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
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      // Chiave del server cambiata (rotazione VAPID): la vecchia iscrizione non riceverebbe nulla.
      if (subscription && !sameKey(subscription)) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }),
        SUBSCRIBE_TIMEOUT_MS
      );
      if (!(await saveOnServer(subscription, locale))) throw new Error("save failed");
      setStatus("on");
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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => undefined);
        await subscription.unsubscribe();
      }
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
