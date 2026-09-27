/**
 * Funzioni tipizzate di invio email, una per categoria. Resend per
 * auth/security, Brevo per eventi/comunicazioni — un solo provider per
 * categoria, nessun invio doppio (design spec §1). Non logga mai token,
 * password, API key o corpo completo dell'email: solo categoria,
 * provider, esito, message id (design spec §7, §10).
 *
 * ⚠️ Solo lato server.
 */

import { getResendClient } from "./resend";
import { sendViaBrevo } from "./brevo";
import { renderResetPasswordEmail } from "./templates/reset-password";

export type SendEmailResult = { ok: true; messageId?: string } | { ok: false; error: string };

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  locale: "it" | "ar";
  expirationMinutes: number;
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    console.error("[email] reset-password send skipped: RESEND_API_KEY not configured");
    return { ok: false, error: "provider_not_configured" };
  }

  // Il mittente di prova di Resend consegna solo alla casella del titolare
  // dell'account Resend: accettabile in sviluppo, in produzione farebbe
  // "riuscire" l'invio senza che l'utente reale riceva nulla.
  const from =
    process.env.EMAIL_FROM_AUTH ||
    (process.env.NODE_ENV === "production" ? "" : "onboarding@resend.dev");
  if (!from) {
    console.error("[email] reset-password send skipped: EMAIL_FROM_AUTH not configured");
    return { ok: false, error: "provider_not_configured" };
  }
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  try {
    const { subject, html, text } = await renderResetPasswordEmail({
      resetUrl: params.resetUrl,
      locale: params.locale,
      expirationMinutes: params.expirationMinutes,
    });

    const { data, error } = await client.emails.send({
      to: params.to,
      from,
      subject,
      html,
      text,
      replyTo,
    });

    if (error || !data) {
      console.error("[email] reset-password send failed", { provider: "resend" });
      return { ok: false, error: "send_failed" };
    }

    console.log("[email] reset-password sent", { provider: "resend", messageId: data.id });
    return { ok: true, messageId: data.id };
  } catch {
    console.error("[email] reset-password send threw", { provider: "resend" });
    return { ok: false, error: "send_failed" };
  }
}

// Flussi email non ancora attivi (design spec §7, §11). Nessuno li chiama.
// Invece di lanciare "not implemented" (che farebbe fallire con un 500 la
// route che un domani li collegasse senza gestire l'eccezione) restituiscono
// un esito esplicito di mancato invio, come per un provider non configurato:
// il chiamante deve comunque controllare `ok`.
function notImplemented(flow: string): SendEmailResult {
  console.warn("[email] flow not implemented", { flow });
  return { ok: false, error: "not_implemented" };
}

export async function sendVerificationEmail(): Promise<SendEmailResult> {
  return notImplemented("verify-email");
}

export async function sendBookingConfirmationEmail(): Promise<SendEmailResult> {
  return notImplemented("booking-confirmation");
}

export async function sendEventReminderEmail(): Promise<SendEmailResult> {
  return notImplemented("event-reminder");
}

export async function sendNewsletter(): Promise<SendEmailResult> {
  return notImplemented("newsletter");
}

// Riesportato per completezza del modulo Brevo predisposto (design spec §7).
export { sendViaBrevo };
