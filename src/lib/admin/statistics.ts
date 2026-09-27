/**
 * Statistiche per il pannello admin: solo conteggi aggregati, nessun dato
 * personale. Calcolate al momento della richiesta con aggregazioni MongoDB.
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "@/lib/mongo/client";
import { getEventi } from "@/lib/mongo/content";
import { countPrayerRequestsByState } from "@/lib/mongo/prayer-requests";
import { countPushSubscriptions } from "@/lib/mongo/push-subscriptions";
import { listPublishedAvvisi, filterActiveAvvisi } from "@/lib/mongo/announcements";

export const AGE_GROUPS = ["0-11", "12-18", "19-29", "30-45", "46-65", "65+"] as const;
export const USER_ROLES = ["credente", "madre", "padre", "ospite_chiesa", "prete"] as const;
const MONTHS = 12;
const EVENTS_IN_CHART = 10;
const PAST_EVENTS_DAYS = 90;

export interface EventStat {
  id: string;
  titolo: string;
  data: string;
  /** Persone iscritte (le famiglie contano i loro membri). */
  persone: number;
  iscrizioni: number;
  pagate: number;
  postiDisponibili?: number;
  passato: boolean;
}

export interface AdminStatistics {
  generatedAt: string;
  utenti: {
    totale: number;
    ultimi30Giorni: number;
    emailVerificate: number;
    perMese: { mese: string; nuovi: number }[];
    perFasciaEta: { fascia: string; utenti: number }[];
    perRuolo: { ruolo: string; utenti: number }[];
  };
  eventi: { inProgramma: number; personeIscritteInProgramma: number; dettaglio: EventStat[] };
  richiestePreghiera: { nuova: number; letta: number; archiviata: number };
  notifiche: { dispositivi: number };
  avvisiAttivi: number;
}

/** Ultimi `count` mesi come "YYYY-MM", dal più vecchio al corrente. */
export function lastMonths(now: Date, count = MONTHS): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

/** Data locale "YYYY-MM-DD" degli eventi (salvati come ora di Milano senza fuso). */
function eventDay(data: string): string {
  return data.slice(0, 10);
}

export async function getAdminStatistics(now = new Date()): Promise<AdminStatistics> {
  const db = await getDb();
  const users = db.collection("users");
  const registrations = db.collection("event_registrations");
  const months = lastMonths(now);
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [userFacets, perEvent, eventi, prayer, push, avvisi] = await Promise.all([
    users
      .aggregate<{
        totale: { n: number }[];
        recenti: { n: number }[];
        verificate: { n: number }[];
        perMese: { _id: string; n: number }[];
        perFascia: { _id: string; n: number }[];
        perRuolo: { _id: string; n: number }[];
      }>([
        {
          $facet: {
            totale: [{ $count: "n" }],
            recenti: [{ $match: { createdAt: { $gte: since30 } } }, { $count: "n" }],
            verificate: [{ $match: { emailVerificata: true } }, { $count: "n" }],
            perMese: [
              { $match: { createdAt: { $gte: `${months[0]}-01` } } },
              { $group: { _id: { $substrBytes: ["$createdAt", 0, 7] }, n: { $sum: 1 } } },
            ],
            perFascia: [{ $group: { _id: "$ageGroup", n: { $sum: 1 } } }],
            perRuolo: [{ $group: { _id: "$role", n: { $sum: 1 } } }],
          },
        },
      ])
      .toArray()
      .then((rows) => rows[0]),
    registrations
      .aggregate<{ _id: string; iscrizioni: number; persone: number; pagate: number }>([
        {
          $group: {
            _id: "$eventoId",
            iscrizioni: { $sum: 1 },
            persone: {
              $sum: {
                $cond: [
                  { $eq: ["$registrationType", "family"] },
                  { $size: { $ifNull: ["$familyMembers", []] } },
                  1,
                ],
              },
            },
            pagate: { $sum: { $cond: ["$ha_pagato", 1, 0] } },
          },
        },
      ])
      .toArray(),
    getEventi(),
    countPrayerRequestsByState(),
    countPushSubscriptions().catch(() => ({ total: 0, it: 0, ar: 0 })),
    listPublishedAvvisi(now).then((list) => filterActiveAvvisi(list, now)),
  ]);

  const byEvent = new Map(perEvent.map((row) => [row._id, row]));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(now);
  const oldestShown = new Date(now.getTime() - PAST_EVENTS_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const dettaglio: EventStat[] = eventi
    .filter((e) => typeof e.data === "string" && eventDay(e.data) >= oldestShown)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((e) => {
      const row = byEvent.get(e.id);
      return {
        id: e.id,
        titolo: e.titolo,
        data: e.data,
        persone: row?.persone ?? 0,
        iscrizioni: row?.iscrizioni ?? 0,
        pagate: row?.pagate ?? 0,
        postiDisponibili:
          typeof e.postiDisponibili === "number" && e.postiDisponibili > 0
            ? e.postiDisponibili
            : undefined,
        passato: eventDay(e.data) < today,
      };
    });
  // Nel grafico: i prossimi eventi, completati con i più recenti già passati.
  const upcoming = dettaglio.filter((e) => !e.passato);
  const past = dettaglio.filter((e) => e.passato).reverse();
  const shown = [
    ...upcoming.slice(0, EVENTS_IN_CHART),
    ...past.slice(0, Math.max(0, EVENTS_IN_CHART - upcoming.length)),
  ].sort((a, b) => a.data.localeCompare(b.data));

  const count = (rows: { n: number }[] | undefined) => rows?.[0]?.n ?? 0;
  const monthMap = new Map((userFacets?.perMese ?? []).map((r) => [r._id, r.n]));
  const fasciaMap = new Map((userFacets?.perFascia ?? []).map((r) => [r._id, r.n]));
  const ruoloMap = new Map((userFacets?.perRuolo ?? []).map((r) => [r._id, r.n]));

  return {
    generatedAt: now.toISOString(),
    utenti: {
      totale: count(userFacets?.totale),
      ultimi30Giorni: count(userFacets?.recenti),
      emailVerificate: count(userFacets?.verificate),
      perMese: months.map((mese) => ({ mese, nuovi: monthMap.get(mese) ?? 0 })),
      perFasciaEta: AGE_GROUPS.map((fascia) => ({ fascia, utenti: fasciaMap.get(fascia) ?? 0 })),
      perRuolo: USER_ROLES.map((ruolo) => ({ ruolo, utenti: ruoloMap.get(ruolo) ?? 0 })),
    },
    eventi: {
      inProgramma: upcoming.length,
      personeIscritteInProgramma: upcoming.reduce((sum, e) => sum + e.persone, 0),
      dettaglio: shown,
    },
    richiestePreghiera: prayer,
    notifiche: { dispositivi: push.total },
    avvisiAttivi: avvisi.length,
  };
}
