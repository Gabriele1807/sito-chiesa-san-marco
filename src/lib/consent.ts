import { useSyncExternalStore } from "react";

/**
 * Consenso ai contenuti di terze parti (Google Maps, YouTube, Google Drive).
 *
 * I cookie tecnici non richiedono consenso e non passano da qui. La scelta
 * dell'utente è salvata in un cookie tecnico di prima parte (`cookie_consent`,
 * 6 mesi) e rispetta le Linee guida cookie del Garante (10/06/2021): nessuna
 * pre-selezione, rifiuto semplice quanto l'accettazione, scelta ripetibile.
 */

export const CONSENT_COOKIE = "cookie_consent";
// Incrementare quando cambiano le categorie/finalità: richiede una nuova scelta.
export const CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // ~6 mesi

const CHANGE_EVENT = "consent-change";
const OPEN_EVENT = "consent-open";

export interface ConsentChoice {
  thirdParty: boolean;
}

export interface ConsentState {
  /** "unknown" = lato server / prima dell'idratazione: non mostrare nulla. */
  status: "unknown" | "undecided" | "decided";
  thirdParty: boolean;
}

function readRaw(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  return match ? match.slice(CONSENT_COOKIE.length + 1) : "";
}

function parse(raw: string): ConsentState {
  if (raw === "ssr") return { status: "unknown", thirdParty: false };
  if (!raw) return { status: "undecided", thirdParty: false };
  try {
    const data = JSON.parse(decodeURIComponent(raw));
    if (data?.v === CONSENT_VERSION && typeof data.thirdParty === "boolean") {
      return { status: "decided", thirdParty: data.thirdParty };
    }
  } catch {
    // cookie malformato: trattato come "nessuna scelta"
  }
  return { status: "undecided", thirdParty: false };
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function useConsent(): ConsentState {
  // Il valore sentinella "ssr" evita che il banner finisca nell'HTML del
  // server e poi lampeggi per chi ha già scelto.
  const raw = useSyncExternalStore(subscribe, readRaw, () => "ssr");
  return parse(raw);
}

export function saveConsent(choice: ConsentChoice): void {
  const value = encodeURIComponent(
    JSON.stringify({ v: CONSENT_VERSION, thirdParty: choice.thirdParty, ts: Date.now() })
  );
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Riapre il pannello delle preferenze (link «Gestisci cookie» nel footer). */
export function openConsentPreferences(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenConsentPreferences(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
