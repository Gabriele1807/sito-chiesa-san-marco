import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runEventReminders } from "@/lib/events/reminders";
import { archiveStalePrayerRequests } from "@/lib/mongo/prayer-requests";

/**
 * GET /api/cron/event-reminders — invia i promemoria degli eventi di domani
 * e archivia le richieste di preghiera non gestite da oltre 60 giorni.
 *
 * Chiamato dal cron di Vercel (vercel.json), che aggiunge automaticamente
 * `Authorization: Bearer <CRON_SECRET>`. Senza CRON_SECRET configurata la
 * route non fa nulla: non deve mai poter essere avviata da chiunque.
 */
export const maxDuration = 60;

function authorized(request: Request, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] event-reminders: CRON_SECRET non configurata, esecuzione saltata");
    return NextResponse.json({ success: false, error: "not_configured" }, { status: 503 });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEventReminders();
    console.log("[cron] event-reminders", result);
    // Manutenzione giornaliera: archivia le richieste di preghiera rimaste
    // senza gestione (vedi archiveStalePrayerRequests). Un errore qui non
    // deve far risultare falliti i promemoria già inviati.
    const prayerArchived = await archiveStalePrayerRequests().catch((err) => {
      console.error(
        "[cron] archiviazione richieste di preghiera fallita",
        err instanceof Error ? err.message : err
      );
      return 0;
    });
    return NextResponse.json({ success: true, ...result, prayerArchived });
  } catch (err) {
    console.error("[cron] event-reminders fallito", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
