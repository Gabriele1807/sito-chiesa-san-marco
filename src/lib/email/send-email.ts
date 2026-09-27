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
import { renderVerifyEmail, type VerifyEmailTemplateParams } from "./templates/verify-email";
import {
  renderBookingConfirmationEmail,
  type BookingConfirmationTemplateParams,
} from "./templates/booking-confirmation";
import {
  renderEventReminderEmail,
  type EventReminderTemplateParams,
} from "./templates/event-reminder";

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

// ---------------- Invio generico ----------------

type EmailCategory = "auth" | "events";

interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Mittente per categoria. In produzione deve essere configurato
 * esplicitamente: il mittente di prova di Resend consegna solo al titolare
 * dell'account, farebbe "riuscire" invii che nessuno riceve.
 */
function senderFor(category: EmailCategory): string {
  const configured =
    category === "events"
      ? process.env.EMAIL_FROM_EVENTS || process.env.EMAIL_FROM_AUTH
      : process.env.EMAIL_FROM_AUTH;
  return configured || (process.env.NODE_ENV === "production" ? "" : "onboarding@resend.dev");
}

/**
 * Consegna un'email già composta.
 *  - auth (verifica account): Resend, come il reset password.
 *  - events (conferme, promemoria): Brevo se BREVO_API_KEY ed
 *    EMAIL_FROM_EVENTS sono configurate, altrimenti Resend.
 * Nei log solo flusso, provider ed esito: mai destinatario, link o token.
 */
async function deliverEmail(
  category: EmailCategory,
  flow: string,
  email: OutgoingEmail
): Promise<SendEmailResult> {
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  if (category === "events" && process.env.BREVO_API_KEY && process.env.EMAIL_FROM_EVENTS) {
    const result = await sendViaBrevo({
      to: email.to,
      from: process.env.EMAIL_FROM_EVENTS,
      subject: email.subject,
      html: email.html,
      replyTo,
    });
    if (!result.ok) {
      console.error(`[email] ${flow} send failed`, { provider: "brevo", error: result.error });
      return { ok: false, error: result.error ?? "send_failed" };
    }
    console.log(`[email] ${flow} sent`, { provider: "brevo", messageId: result.messageId });
    return { ok: true, messageId: result.messageId };
  }

  const client = getResendClient();
  const from = senderFor(category);
  if (!client || !from) {
    console.error(`[email] ${flow} send skipped: email provider not configured`, {
      resendKey: Boolean(client),
      sender: Boolean(from),
    });
    return { ok: false, error: "provider_not_configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      to: email.to,
      from,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo,
    });
    if (error || !data) {
      console.error(`[email] ${flow} send failed`, { provider: "resend" });
      return { ok: false, error: "send_failed" };
    }
    console.log(`[email] ${flow} sent`, { provider: "resend", messageId: data.id });
    return { ok: true, messageId: data.id };
  } catch {
    console.error(`[email] ${flow} send threw`, { provider: "resend" });
    return { ok: false, error: "send_failed" };
  }
}

async function renderAndDeliver(
  category: EmailCategory,
  flow: string,
  to: string,
  render: () => Promise<{ subject: string; html: string; text: string }>
): Promise<SendEmailResult> {
  let rendered;
  try {
    rendered = await render();
  } catch (err) {
    console.error(`[email] ${flow} render failed`, err instanceof Error ? err.message : "unknown");
    return { ok: false, error: "render_failed" };
  }
  return deliverEmail(category, flow, { to, ...rendered });
}

export function sendVerificationEmail(
  params: VerifyEmailTemplateParams & { to: string }
): Promise<SendEmailResult> {
  return renderAndDeliver("auth", "verify-email", params.to, () => renderVerifyEmail(params));
}

export function sendBookingConfirmationEmail(
  params: BookingConfirmationTemplateParams & { to: string }
): Promise<SendEmailResult> {
  return renderAndDeliver("events", "booking-confirmation", params.to, () =>
    renderBookingConfirmationEmail(params)
  );
}

export function sendEventReminderEmail(
  params: EventReminderTemplateParams & { to: string }
): Promise<SendEmailResult> {
  return renderAndDeliver("events", "event-reminder", params.to, () =>
    renderEventReminderEmail(params)
  );
}

// Newsletter: non attiva (serve una gestione di iscritti e consensi che il
// progetto non ha). Restituisce un esito esplicito invece di lanciare.
export async function sendNewsletter(): Promise<SendEmailResult> {
  console.warn("[email] flow not implemented", { flow: "newsletter" });
  return { ok: false, error: "not_implemented" };
}

// Riesportato per completezza del modulo Brevo predisposto (design spec §7).
export { sendViaBrevo };
