import { NextResponse } from "next/server";
import {
  consumePasswordResetToken,
  releasePasswordResetToken,
} from "@/lib/mongo/password-reset-tokens";
import { findUserByIdFull, updateUserPassword, setHasPassword } from "@/lib/mongo/users";
import { deleteAllUserSessions } from "@/lib/mongo/sessions";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import {
  isResetPasswordRateLimited,
  recordResetPasswordAttempt,
} from "@/lib/auth/password-reset-rate-limit";
import { getClientIp } from "@/lib/auth/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    // Validato dopo le regole password: un tentativo con password debole
    // non deve consumare il link, che l'utente può ancora riusare.
    const tokenDoc = await consumePasswordResetToken(token);
    if (!tokenDoc) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }

    // Da qui in poi il link è consumato. Va rilasciato (riusabile) solo se
    // la password NON è stata cambiata: dopo il salvataggio della nuova
    // password il link non deve mai tornare valido.
    let passwordSaved = false;
    try {
      const user = await findUserByIdFull(tokenDoc.userId);
      if (!user || !user.attivo) {
        return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
      }

      const newHash = await hashPassword(newPassword);
      // Prima si invalidano tutte le sessioni (imposta passwordChangedAt,
      // design spec §3), poi si salva la password: se il salvataggio fallisce
      // l'utente deve solo riaccedere con la vecchia password; nell'ordine
      // inverso un errore qui lascerebbe attive sessioni (anche di un
      // eventuale intruso) con la password già cambiata. Nessuna sessione
      // viene creata: il client viene mandato al login.
      await deleteAllUserSessions(tokenDoc.userId);
      await updateUserPassword(tokenDoc.userId, newHash);
      passwordSaved = true;
      await setHasPassword(tokenDoc.userId, true);

      // Un admin promosso da utente (adminRequest "approved") accede con la
      // copia della password in Supabase `admin_users`, collegata per
      // username: va aggiornata anche lì, come fa /api/auth/change-password.
      // Altrimenti dopo il reset il login admin userebbe ancora la vecchia
      // password e il recupero via email non funzionerebbe per gli admin.
      if (user.adminRequest === "approved" && user.username) {
        const { error } = await supabaseAdmin
          .from("admin_users")
          .update({ password_hash: newHash })
          .eq("username", user.username);
        if (error) {
          console.error("[reset-password] sincronizzazione password admin fallita:", error.message);
        }
      }
    } catch (err) {
      if (!passwordSaved) {
        await releasePasswordResetToken(tokenDoc._id, tokenDoc.consumedAt).catch((releaseErr) =>
          console.error("Errore rilascio token reset password:", releaseErr)
        );
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/auth/reset-password:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
