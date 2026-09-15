/**
 * Wrapper sottile attorno alle API Brevo (transactional email), usato per
 * la categoria "eventi/comunicazioni" (vedi design spec §1, §7). Nessun
 * chiamante reale in questa fase: solo predisposto per i template stub in
 * ./templates/booking-confirmation.ts, event-reminder.ts, newsletter.ts.
 *
 * ⚠️ Solo lato server.
 */

const BREVO_SEND_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface BrevoSendParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface BrevoSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendViaBrevo(params: BrevoSendParams): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "provider_not_configured" };

  try {
    const res = await fetch(BREVO_SEND_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: params.from },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        replyTo: params.replyTo ? { email: params.replyTo } : undefined,
      }),
    });

    if (!res.ok) return { ok: false, error: "send_failed" };
    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
