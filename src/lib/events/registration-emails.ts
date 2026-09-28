/**
 * Email legate alle iscrizioni agli eventi: conferma subito dopo
 * l'iscrizione e promemoria il giorno prima (job /api/cron/event-reminders).
 *
 * Destinatario: solo l'email dell'account che ha fatto l'iscrizione (le
 * iscrizioni richiedono un account). Nessun invio se non c'è un indirizzo.
 *
 * ⚠️ Solo lato server.
 */

import type { Evento, IscrizioneEvento } from "@/types";
import { getSiteUrl } from "@/lib/site-url";
import {
  sendBookingConfirmationEmail,
  sendEventReminderEmail,
  type SendEmailResult,
} from "@/lib/email/send-email";
import type { EventEmailData } from "@/lib/email/templates/booking-confirmation";

export function registrationRecipient(
  iscrizione: Pick<IscrizioneEvento, "createdByEmail">
): string | null {
  // Solo l'email dell'account che ha fatto l'iscrizione: l'email scritta nel
  // modulo (campo `email`) non riceve mai messaggi, altrimenti chiunque
  // potrebbe far inviare email dal dominio della parrocchia a indirizzi altrui.
  const email = (iscrizione.createdByEmail || "").trim();
  return email || null;
}

export function registrationEmailData(
  evento: Evento,
  iscrizione: IscrizioneEvento
): EventEmailData {
  const partecipanti =
    iscrizione.registrationType === "family" && iscrizione.familyMembers?.length
      ? iscrizione.familyMembers.map((m) => m.fullName.trim()).filter(Boolean)
      : [`${iscrizione.nome} ${iscrizione.cognome}`.trim()].filter(Boolean);
  const punto = iscrizione.raccoglimentoPunto;
  return {
    locale: iscrizione.emailLocale === "ar" ? "ar" : "it",
    eventTitle: evento.titolo,
    eventDate: evento.data,
    luogo: evento.luogo || undefined,
    partecipanti,
    raccolta: punto?.label ? [punto.label, punto.orario].filter(Boolean).join(" · ") : undefined,
    paymentDeadline: evento.paymentDeadline || undefined,
  };
}

export async function sendRegistrationConfirmation(
  evento: Evento,
  iscrizione: IscrizioneEvento
): Promise<SendEmailResult | null> {
  const to = registrationRecipient(iscrizione);
  const siteUrl = getSiteUrl();
  if (!to) return null;
  if (!siteUrl) {
    console.error("[iscrizioni] conferma non inviata: NEXT_PUBLIC_SITE_URL mancante");
    return { ok: false, error: "site_url_missing" };
  }
  return sendBookingConfirmationEmail({
    to,
    ...registrationEmailData(evento, iscrizione),
    manageUrl: `${siteUrl}/iscrizioni`,
  });
}

export async function sendRegistrationReminder(
  evento: Evento,
  iscrizione: IscrizioneEvento
): Promise<SendEmailResult | null> {
  const to = registrationRecipient(iscrizione);
  const siteUrl = getSiteUrl();
  if (!to || !siteUrl) return null;
  return sendEventReminderEmail({
    to,
    ...registrationEmailData(evento, iscrizione),
    eventUrl: `${siteUrl}/eventi`,
  });
}
