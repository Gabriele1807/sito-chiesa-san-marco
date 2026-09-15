import { NextResponse } from "next/server";
import {
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/mongo/password-reset-tokens";
import { updateUserPassword, setPasswordChangedAt, setHasPassword } from "@/lib/mongo/users";
import { deleteAllUserSessions } from "@/lib/mongo/sessions";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import {
  isResetPasswordRateLimited,
  recordResetPasswordAttempt,
} from "@/lib/auth/password-reset-rate-limit";
import { getClientIp } from "@/lib/auth/rate-limit";

const INVALID_TOKEN_RESPONSE = { success: false, error: "Link non valido o scaduto" };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Token e nuova password richiesti" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    if (await isResetPasswordRateLimited(ip)) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }
    await recordResetPasswordAttempt(ip);

    const passwordRules = validatePasswordRules(newPassword);
    if (Object.values(passwordRules).some((rule) => !rule)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La nuova password deve contenere almeno una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale",
        },
        { status: 400 }
      );
    }

    const tokenDoc = await findValidPasswordResetToken(token);
    if (!tokenDoc) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(tokenDoc.userId, newHash);
    await setHasPassword(tokenDoc.userId, true);
    await setPasswordChangedAt(tokenDoc.userId);
    await markPasswordResetTokenUsed(tokenDoc._id);
    await deleteAllUserSessions(tokenDoc.userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/auth/reset-password:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
