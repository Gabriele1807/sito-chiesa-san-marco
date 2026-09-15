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

  const from = process.env.EMAIL_FROM_AUTH || "onboarding@resend.dev";
  const replyTo = process.env.EMAIL_REPLY_TO;

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

/** Stub — vedi design spec §7, §11. Non collegato a nessun flusso reale. */
export async function sendVerificationEmail(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

/** Stub — vedi design spec §7, §11. Non collegato a registrations.ts. */
export async function sendBookingConfirmationEmail(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

/** Stub — vedi design spec §7, §11. Non collegato a registrations.ts. */
export async function sendEventReminderEmail(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

/** Stub — vedi design spec §7, §11. */
export async function sendNewsletter(): Promise<SendEmailResult> {
  throw new Error("not implemented");
}

// Riesportato per completezza del modulo Brevo predisposto (design spec §7).
export { sendViaBrevo };
