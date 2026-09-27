"use client";

/**
 * Stato condiviso dell'installazione PWA, letto con useSyncExternalStore da
 * più componenti (invito in basso, pulsante nel footer, notifiche).
 *
 * L'evento `beforeinstallprompt` (Chrome, Edge, Samsung Internet, Android)
 * arriva una sola volta per caricamento pagina: va catturato subito e
 * conservato qui, altrimenti il pulsante "Installa" non avrebbe nulla da
 * mostrare. Safari (iOS/macOS) e Firefox non lo emettono: su iOS si
 * mostrano le istruzioni per "Aggiungi alla schermata Home".
 */

import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "ios-safari" | "ios-other" | "prompt" | "unsupported";

export interface InstallState {
  /** Aperta come app installata (standalone). */
  standalone: boolean;
  platform: InstallPlatform;
  installed: boolean;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let state: InstallState = { standalone: false, platform: "unsupported", installed: false };
const listeners = new Set<() => void>();
let initialised = false;

function emit(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function detectStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari iOS
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): "ios-safari" | "ios-other" | null {
  const ua = navigator.userAgent;
  // iPadOS 13+ si presenta come Mac: lo riconosce il touch.
  const isIos =
    /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (!isIos) return null;
  // Chrome, Firefox, Edge… su iOS non possono installare PWA (solo Safari può,
  // salvo iOS 16.4+ dal menu Condividi di alcuni browser: resta più semplice
  // indicare Safari).
  return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? "ios-other" : "ios-safari";
}

/** Da chiamare una volta, il prima possibile (PwaManager). */
export function initInstallStore(): void {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  const ios = detectIos();
  // Evento arrivato prima dell'idratazione di React: lo cattura lo script
  // inline di ./early-install-script.ts, incluso in src/app/layout.tsx.
  const early = (window as Window & { __smInstallPrompt?: BeforeInstallPromptEvent })
    .__smInstallPrompt;
  if (early) deferredPrompt = early;
  emit({ standalone: detectStandalone(), platform: early ? "prompt" : (ios ?? "unsupported") });

  window.addEventListener("beforeinstallprompt", (event) => {
    // Evita la mini-barra automatica del browser: l'invito lo mostra il sito
    // al momento giusto (vedi InstallPrompt).
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit({ platform: "prompt" });
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit({ installed: true, platform: ios ?? "unsupported" });
  });

  window.matchMedia?.("(display-mode: standalone)").addEventListener?.("change", (event) => {
    emit({ standalone: event.matches });
  });
}

/** Apre il dialogo di installazione del browser. Restituisce l'esito. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return "unavailable";
  deferredPrompt = null;
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  emit({
    platform: outcome === "accepted" ? state.platform : "unsupported",
    installed: outcome === "accepted",
  });
  return outcome;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: InstallState = { standalone: false, platform: "unsupported", installed: false };

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  );
}

/** True se il sito può offrire l'installazione su questo dispositivo. */
export function canOfferInstall(s: InstallState): boolean {
  return (
    !s.standalone &&
    !s.installed &&
    (s.platform === "prompt" || s.platform === "ios-safari" || s.platform === "ios-other")
  );
}
