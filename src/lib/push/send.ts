/**
 * Invio delle notifiche push a tutti i dispositivi iscritti.
 *
 * ⚠️ Solo lato server.
 */

import webpush from "web-push";
import { getVapidConfig } from "./config";
import {
  iteratePushSubscriptions,
  countPendingPushSubscriptions,
  deletePushSubscription,
  markPushHandled,
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
  /** Dispositivi non ancora raggiunti perché è scaduto il tempo: si riprende con lo stesso runId. */
  remaining: number;
}

/**
 * Tempo massimo di invio per richiesta. La route ha 60 s (vercel.json):
 * oltre questo tempo ci si ferma e si segnala quanti dispositivi mancano,
 * invece di essere interrotti a metà senza saperlo.
 */
const DEFAULT_TIME_BUDGET_MS = 45_000;

const CONCURRENCY = 10;
const TTL_SECONDS = 24 * 60 * 60; // se il telefono è spento, consegna entro un giorno

export class PushNotConfiguredError extends Error {
  constructor() {
    super("Notifiche push non configurate (chiavi VAPID mancanti)");
  }
}

/**
 * Invia a ogni iscrizione ancora da raggiungere per l'invio `runId` il
 * messaggio nella sua lingua. Le iscrizioni scadute (404/410) vengono
 * eliminate; le altre vengono segnate come gestite per `runId`, così
 * richiamando con lo stesso `runId` si riprende senza doppioni.
 */
export async function sendPushToAll(
  buildPayload: (locale: "it" | "ar") => PushPayload,
  options: { runId: string; urgent?: boolean; timeBudgetMs?: number }
): Promise<PushSendResult> {
  const vapid = getVapidConfig();
  if (!vapid) throw new PushNotConfiguredError();

  const deadline = Date.now() + (options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS);
  const result: PushSendResult = { sent: 0, failed: 0, removed: 0, remaining: 0 };
  const payloads = {
    it: JSON.stringify(buildPayload("it")),
    ar: JSON.stringify(buildPayload("ar")),
  };

  const sendOne = async (sub: PushSubscriptionRecord): Promise<"sent" | "failed" | "removed"> => {
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
      return "sent";
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await deletePushSubscription(sub.endpoint).catch(() => undefined);
        result.removed += 1;
        return "removed";
      }
      result.failed += 1;
      console.error("[push] invio fallito", { status: status ?? "network" });
      return "failed";
    }
  };

  outer: for await (const batch of iteratePushSubscriptions(options.runId)) {
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      if (Date.now() > deadline) break outer;
      const chunk = batch.slice(i, i + CONCURRENCY);
      const outcomes = await Promise.all(chunk.map(sendOne));
      await Promise.all([
        markPushHandled(
          chunk.filter((_, k) => outcomes[k] === "sent").map((s) => s.endpoint),
          options.runId,
          true
        ),
        markPushHandled(
          chunk.filter((_, k) => outcomes[k] === "failed").map((s) => s.endpoint),
          options.runId,
          false
        ),
      ]).catch(() => undefined);
    }
  }

  result.remaining = await countPendingPushSubscriptions(options.runId).catch(() => 0);
  return result;
}
