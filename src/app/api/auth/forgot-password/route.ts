import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/mongo/users";
import { createPasswordResetToken } from "@/lib/mongo/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-email";
import {
  isForgotPasswordRateLimited,
  recordForgotPasswordAttempt,
} from "@/lib/auth/password-reset-rate-limit";
import { getClientIp } from "@/lib/auth/rate-limit";
import { getSiteUrl } from "@/lib/site-url";

/** Stessa lingua con cui l'utente vede il sito (cookie letto da src/i18n/request.ts). */
function requestLocale(request: Request): "it" | "ar" {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/);
  return match?.[1] === "ar" ? "ar" : "it";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_RESPONSE = {
  success: true,
  message:
    "Se l'indirizzo è associato a un account, riceverai una email con le istruzioni per reimpostare la password.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Indirizzo email non valido" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);

    if (await isForgotPasswordRateLimited(ip, email)) {
      // Risposta generica identica, nessun invio: non rivela il rate limit al client.
      return NextResponse.json(GENERIC_RESPONSE);
    }
    await recordForgotPasswordAttempt(ip, email);

    const user = await findUserByEmail(email);
    // Un account disattivato non può comunque accedere: nessuna email.
    if (user && user.attivo !== false) {
      const siteUrl = getSiteUrl();
      if (!siteUrl) {
        // Senza URL assoluto il link nell'email sarebbe relativo e inutilizzabile:
        // meglio non creare token né inviare, e segnalarlo nei log server.
        console.error("[forgot-password] NEXT_PUBLIC_SITE_URL mancante o non valida: invio saltato");
        return NextResponse.json(GENERIC_RESPONSE);
      }

      const { rawToken, expiresAt } = await createPasswordResetToken(user._id, {
        requestIp: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      const resetUrl = `${siteUrl}/reset-password?token=${rawToken}`;
      const expirationMinutes = Math.max(
        1,
        Math.round((expiresAt.getTime() - Date.now()) / 60000)
      );

      const result = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        locale: requestLocale(request),
        expirationMinutes,
      });
      if (!result.ok) {
        console.error("[forgot-password] send failed", { error: result.error });
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("Errore POST /api/auth/forgot-password:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
