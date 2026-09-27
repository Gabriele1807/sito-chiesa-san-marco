/**
 * Promemoria email del giorno prima degli eventi.
 * Eseguito una volta al giorno dal cron di Vercel (vercel.json →
 * /api/cron/event-reminders): invia a chi è iscritto a un evento che si
 * tiene "domani" (ora di Milano). Ogni iscrizione riceve al massimo un
 * promemoria (campo `reminderSentAt`, prenotato in modo atomico).
 *
 * ⚠️ Solo lato server.
 */

import { getEventi } from "@/lib/mongo/content";
import {
  getIscrizioniWithoutReminder,
  claimIscrizioneReminder,
  releaseIscrizioneReminder,
} from "@/lib/mongo/registrations";
import { registrationRecipient, sendRegistrationReminder } from "./registration-emails";

export interface ReminderRunResult {
  date: string;
  events: number;
  sent: number;
  failed: number;
  withoutEmail: number;
}

/** "YYYY-MM-DD" del giorno dopo `now`, nel fuso orario di Milano. */
export function tomorrowInRome(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const tomorrow = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + 1));
  return tomorrow.toISOString().slice(0, 10);
}

export async function runEventReminders(now = new Date()): Promise<ReminderRunResult> {
  const date = tomorrowInRome(now);
  // Le date degli eventi sono salvate come "YYYY-MM-DDTHH:mm" in ora italiana.
  const eventi = (await getEventi()).filter(
    (e) => typeof e.data === "string" && e.data.startsWith(date)
  );
  const result: ReminderRunResult = {
    date,
    events: eventi.length,
    sent: 0,
    failed: 0,
    withoutEmail: 0,
  };

  for (const evento of eventi) {
    const iscrizioni = await getIscrizioniWithoutReminder(evento.id);
    for (const iscrizione of iscrizioni) {
      const id = iscrizione._id;
      if (!id) continue;
      if (!registrationRecipient(iscrizione)) {
        result.withoutEmail += 1;
        continue;
      }
      if (!(await claimIscrizioneReminder(id))) continue; // già gestita da un'altra esecuzione

      const sent = await sendRegistrationReminder(evento, iscrizione).catch(() => null);
      if (sent?.ok) {
        result.sent += 1;
      } else {
        result.failed += 1;
        await releaseIscrizioneReminder(id).catch(() => undefined);
      }
    }
  }

  return result;
}
