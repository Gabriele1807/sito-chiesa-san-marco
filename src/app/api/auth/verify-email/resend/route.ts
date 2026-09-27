import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { secondsUntilNextVerificationEmail } from "@/lib/mongo/email-verification-tokens";
import { startEmailVerification, localeFromRequest } from "@/lib/auth/email-verification";

/** POST /api/auth/verify-email/resend — nuovo link di verifica per l'utente connesso. */
export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("user_session")?.value;
    const session = token ? await validateUserSession(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
    }

    const user = await findUserByIdFull(session.userId);
    if (!user)
      return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
    if (user.emailVerificata) return NextResponse.json({ success: true, alreadyVerified: true });

    const wait = await secondsUntilNextVerificationEmail(session.userId);
    if (wait > 0) {
      return NextResponse.json(
        { success: false, error: "too_soon", retryAfter: wait },
        { status: 429 }
      );
    }

    const result = await startEmailVerification(
      session.userId,
      user.email,
      localeFromRequest(request)
    );
    if (!result.ok) {
      return NextResponse.json({ success: false, error: "send_failed" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      "Errore POST /api/auth/verify-email/resend:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ success: false, error: "server" }, { status: 500 });
  }
}
