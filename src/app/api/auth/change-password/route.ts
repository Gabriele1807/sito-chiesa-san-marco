import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession, createUserSession, deleteAllUserSessions } from "@/lib/mongo/sessions";
import { verifyJwt } from "@/lib/auth/jwt";
import { findUserByIdFull, findUserByUsername, updateUserPassword } from "@/lib/mongo/users";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";
import { validateSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_session")?.value;
    const adminToken = cookieStore.get("admin_session")?.value;

    if (!userToken && !adminToken) {
      return NextResponse.json(
        { success: false, error: "Non autenticato" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Password attuale e nuova password richieste" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "La nuova password deve avere almeno 8 caratteri" },
        { status: 400 }
      );
    }

    const passwordRules = validatePasswordRules(newPassword);
    if (Object.values(passwordRules).some((rule) => !rule)) {
      return NextResponse.json(
        {
          success: false,
          error: "La nuova password deve contenere almeno una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale",
        },
        { status: 400 }
      );
    }

    let mongoUser: (UserProfile & { _id: string }) | null = null;
    let needsSupabaseSync = false;

    if (userToken) {
      // Sessione utente normale (MongoDB)
      const session = await validateUserSession(userToken);
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Sessione scaduta" },
          { status: 401 }
        );
      }
      mongoUser = await findUserByIdFull(session.userId);
      needsSupabaseSync = mongoUser?.adminRequest === "approved";
    } else if (adminToken) {
      // Sessione admin (JWT) — cerca l'utente MongoDB tramite username
      const adminSession = await validateSession(adminToken);
      if (!adminSession) {
        return NextResponse.json(
          { success: false, error: "Sessione admin scaduta" },
          { status: 401 }
        );
      }

      const { data: adminUser } = await supabaseAdmin
        .from("admin_users")
        .select("username")
        .eq("id", adminSession.id)
        .single();

      if (!adminUser?.username) {
        return NextResponse.json(
          { success: false, error: "Utente admin non trovato" },
          { status: 404 }
        );
      }

      mongoUser = await findUserByUsername(adminUser.username);
      needsSupabaseSync = true;
    }

    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Utente non trovato" },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(currentPassword, mongoUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Password attuale non corretta" },
        { status: 403 }
      );
    }

    const newHash = await hashPassword(newPassword);

    // Aggiorna password su MongoDB
    await updateUserPassword(mongoUser._id, newHash);

    // Invalida tutte le sessioni utente esistenti (design spec §3), inclusa
    // quella di questa richiesta: il suo iat precede passwordChangedAt.
    const passwordChangedAt = await deleteAllUserSessions(mongoUser._id);

    // Chi ha appena cambiato la password resta connesso su questo
    // dispositivo: riemettiamo la sua sessione legandola al nuovo
    // passwordChangedAt (claim `pca`), con la stessa durata di quella
    // originale (24h o "ricordami" 7 giorni).
    if (userToken) {
      const previous = await verifyJwt(userToken);
      const rememberMe = previous ? previous.exp - previous.iat > 24 * 60 * 60 : false;
      const { token, expiresAt } = await createUserSession(mongoUser._id, request, rememberMe, {
        passwordChangedAt,
      });
      cookieStore.set("user_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });
    }

    // Sincronizza su Supabase se è un admin
    if (needsSupabaseSync) {
      await supabaseAdmin
        .from("admin_users")
        .update({ password_hash: newHash })
        .eq("username", mongoUser.username);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/auth/change-password:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
