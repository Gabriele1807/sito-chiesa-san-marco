/**
 * Invio delle notifiche push a tutti i dispositivi iscritti.
 *
 * ⚠️ Solo lato server.
 */

import webpush from "web-push";
import { getVapidConfig } from "./config";
import {
  iteratePushSubscriptions,
  deletePushSubscription,
  markPushDelivered,
  type PushSubscriptionRecord,
} from "@/lib/mongo/push-subscriptions";

export interface PushPayload {
  title: string;
  body: string;
  /** Pagina del sito da aprire al tocco (percorso interno). */
  url: string;
  /** Stesso tag = la notifica sostituisce la precedente invece di accumularsi. */
  tag?: string;
  lang: "it" | "ar";
}

export interface PushSendResult {
  sent: number;
  failed: number;
  removed: number;
}

const CONCURRENCY = 10;
const TTL_SECONDS = 24 * 60 * 60; // se il telefono è spento, consegna entro un giorno

export class PushNotConfiguredError extends Error {
  constructor() {
    super("Notifiche push non configurate (chiavi VAPID mancanti)");
  }
}

/**
 * Invia a ogni iscrizione il messaggio nella sua lingua. Le iscrizioni che
 * il servizio push dichiara scadute (404/410) vengono eliminate.
 */
export async function sendPushToAll(
  buildPayload: (locale: "it" | "ar") => PushPayload,
  options: { urgent?: boolean } = {}
): Promise<PushSendResult> {
  const vapid = getVapidConfig();
  if (!vapid) throw new PushNotConfiguredError();

  const result: PushSendResult = { sent: 0, failed: 0, removed: 0 };
  const payloads = {
    it: JSON.stringify(buildPayload("it")),
    ar: JSON.stringify(buildPayload("ar")),
  };

  const sendOne = async (sub: PushSubscriptionRecord): Promise<string | null> => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payloads[sub.locale],
        {
          vapidDetails: vapid,
          TTL: TTL_SECONDS,
          urgency: options.urgent ? "high" : "normal",
          timeout: 10_000,
        }
      );
      result.sent += 1;
      return sub.endpoint;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await deletePushSubscription(sub.endpoint).catch(() => undefined);
        result.removed += 1;
      } else {
        result.failed += 1;
        console.error("[push] invio fallito", { status: status ?? "network" });
      }
      return null;
    }
  };

  for await (const batch of iteratePushSubscriptions()) {
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const delivered = await Promise.all(batch.slice(i, i + CONCURRENCY).map(sendOne));
      await markPushDelivered(delivered.filter((e): e is string => e !== null)).catch(
        () => undefined
      );
    }
  }

  return result;
}
