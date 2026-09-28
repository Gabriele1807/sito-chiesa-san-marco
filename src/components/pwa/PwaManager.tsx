"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { initInstallStore } from "./install-store";
import InstallPrompt from "./InstallPrompt";
import NotificationPrompt from "./NotificationPrompt";

/**
 * Registra il service worker (/sw.js), segnala gli aggiornamenti e mostra
 * l'invito all'installazione. Montato una volta nel layout radice.
 *
 * In sviluppo il service worker è disattivato (la cache confonderebbe
 * l'hot reload) salvo NEXT_PUBLIC_ENABLE_SW_IN_DEV=1; se ne era rimasto uno
 * registrato viene rimosso.
 */
const SW_ENABLED =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === "1";
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function PwaManager() {
  const t = useTranslations("pwa");
  const pathname = usePathname();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  // Ricarica solo dopo che l'utente ha scelto "Aggiorna". Alla prima
  // installazione il service worker prende il controllo della pagina
  // (clients.claim) e scatena lo stesso evento: ricaricare lì farebbe
  // perdere a chi sta compilando un modulo quello che ha scritto.
  const updateRequested = useRef(false);
  const reloading = useRef(false);

  useEffect(() => {
    initInstallStore();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (!SW_ENABLED) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()));
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;

    const trackInstalling = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        // "installed" con un controller già attivo = aggiornamento pronto;
        // senza controller è la prima installazione, nulla da segnalare.
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
        }
      });
    };

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => undefined);
    };

    const onControllerChange = () => {
      if (!updateRequested.current || reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        if (reg.waiting && navigator.serviceWorker.controller) setWaitingWorker(reg.waiting);
        trackInstalling(reg.installing);
        reg.addEventListener("updatefound", () => trackInstalling(reg.installing));
        interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      })
      .catch((err) => console.error("[pwa] registrazione service worker fallita", err));

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);

    return () => {
      if (interval) clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, []);

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {waitingWorker && (
        <div
          role="status"
          className="border-border bg-surface fixed inset-x-3 top-[4.25rem] z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg"
        >
          <RefreshCw className="text-accent h-4 w-4 shrink-0" aria-hidden />
          <span className="text-foreground/80 flex-1">{t("updateAvailable")}</span>
          <button
            type="button"
            onClick={() => {
              updateRequested.current = true;
              waitingWorker.postMessage({ type: "SKIP_WAITING" });
            }}
            className="bg-accent hover:bg-accent-light rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          >
            {t("updateNow")}
          </button>
        </div>
      )}
      {!isAdmin && (
        <>
          <InstallPrompt />
          <NotificationPrompt />
        </>
      )}
    </>
  );
}
