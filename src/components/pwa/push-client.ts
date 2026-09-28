"use client";

/**
 * Funzioni condivise per l'iscrizione alle notifiche push del dispositivo:
 * usate dal riquadro della pagina Avvisi (PushToggle) e dall'invito
 * mostrato dentro l'app installata (NotificationPrompt).
 */

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

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

/** True se questo browser può ricevere notifiche push (API presenti e chiavi configurate). */
export function pushSupported(): boolean {
  return (
    Boolean(VAPID_PUBLIC_KEY) &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Iscrizione attuale del dispositivo, se esiste. */
export async function currentPushSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/**
 * Chiede il permesso (va chiamata da un tocco dell'utente), iscrive il
 * dispositivo e lo registra sul server. Restituisce l'esito del permesso;
 * lancia un errore se l'iscrizione non riesce.
 */
export async function subscribeToPush(locale: string): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
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
  return permission;
}

/** Disiscrive il dispositivo e lo rimuove dal server. */
export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
  await subscription.unsubscribe();
}
