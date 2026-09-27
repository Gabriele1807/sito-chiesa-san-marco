/**
 * Invio del link di verifica dell'indirizzo email di un utente.
 * Usato alla registrazione, al cambio email e su richiesta dal profilo.
 *
 * ⚠️ Solo lato server.
 */

import {
  createEmailVerificationToken,
  EMAIL_VERIFICATION_HOURS,
} from "@/lib/mongo/email-verification-tokens";
import { sendVerificationEmail, type SendEmailResult } from "@/lib/email/send-email";
import { getSiteUrl } from "@/lib/site-url";

export async function startEmailVerification(
  userId: string,
  email: string,
  locale: "it" | "ar"
): Promise<SendEmailResult> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    console.error("[verify-email] NEXT_PUBLIC_SITE_URL mancante: link di verifica non inviato");
    return { ok: false, error: "site_url_missing" };
  }
  const { rawToken } = await createEmailVerificationToken(userId, email);
  const result = await sendVerificationEmail({
    to: email,
    locale,
    verifyUrl: `${siteUrl}/verifica-email?token=${rawToken}`,
    expirationHours: EMAIL_VERIFICATION_HOURS,
  });
  if (!result.ok) console.error("[verify-email] invio fallito", { error: result.error });
  return result;
}

/** Lingua dal cookie `locale` della richiesta (stessa logica di src/i18n/request.ts). */
export function localeFromRequest(request: Request): "it" | "ar" {
  return /(?:^|;\s*)locale=ar(?:;|$)/.test(request.headers.get("cookie") ?? "") ? "ar" : "it";
}
