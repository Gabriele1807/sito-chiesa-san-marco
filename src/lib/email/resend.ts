/**
 * Wrapper sottile attorno al client Resend. Usato solo per la categoria
 * "auth/security" (vedi design spec §1, §7). Non importare mai
 * RESEND_API_KEY o questo modulo in codice client-side.
 *
 * Non mette in cache l'istanza: la costruzione del client è economica e
 * questo evita di restituire un client "vecchio" se RESEND_API_KEY cambia
 * a runtime (es. nei test, o in caso di rotazione della chiave).
 *
 * ⚠️ Solo lato server.
 */
import { Resend } from "resend";

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}
