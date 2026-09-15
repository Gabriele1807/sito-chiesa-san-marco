import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/mongo/users";
import { createPasswordResetToken } from "@/lib/mongo/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-email";
import {
  isForgotPasswordRateLimited,
  recordForgotPasswordAttempt,
} from "@/lib/auth/password-reset-rate-limit";
import { getClientIp } from "@/lib/auth/rate-limit";

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
    if (user) {
      const { rawToken, expiresAt } = await createPasswordResetToken(user._id, {
        requestIp: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const resetUrl = `${siteUrl}/reset-password?token=${rawToken}`;
      const expirationMinutes = Math.max(
        1,
        Math.round((expiresAt.getTime() - Date.now()) / 60000)
      );

      const result = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        locale: "it",
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
