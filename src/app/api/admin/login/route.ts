import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, cleanExpiredSessions } from "@/lib/auth/session";
import {
  isRateLimited,
  recordFailedAttempt,
  resetAttempts,
  remainingAttempts,
} from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  try {
    // --- Rate limiting ---
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Troppi tentativi. Riprova tra 15 minuti.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username e password obbligatori" },
        { status: 400 }
      );
    }

    // --- Cerca utente su Supabase ---
    const { data: user, error: dbError } = await supabaseAdmin
      .from("admin_users")
      .select("id, username, password_hash, nome, cognome, ruolo, attivo")
      .eq("username", username)
      .single();

    if (dbError || !user) {
      recordFailedAttempt(ip);
      const remaining = remainingAttempts(ip);
      return NextResponse.json(
        {
          success: false,
          error: "Credenziali non valide",
          remaining,
        },
        { status: 401 }
      );
    }

    // --- Account disattivato ---
    if (!user.attivo) {
      return NextResponse.json(
        {
          success: false,
          error: "Account disattivato. Contatta il superadmin.",
        },
        { status: 403 }
      );
    }

    // --- Verifica password ---
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      recordFailedAttempt(ip);
      const remaining = remainingAttempts(ip);
      return NextResponse.json(
        {
          success: false,
          error: "Credenziali non valide",
          remaining,
        },
        { status: 401 }
      );
    }

    // --- Login riuscito ---
    resetAttempts(ip);

    // Pulizia sessioni scadute (non blocca il login se fallisce)
    cleanExpiredSessions().catch(() => {});

    // Aggiorna ultimo_accesso
    await supabaseAdmin
      .from("admin_users")
      .update({ ultimo_accesso: new Date().toISOString() })
      .eq("id", user.id);

    // Crea sessione nel DB
    const { token, expiresAt } = await createSession(
      user.id,
      request,
      rememberMe === true
    );

    // Imposta cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json({
      success: true,
      user: {
        nome: user.nome,
        cognome: user.cognome,
        ruolo: user.ruolo,
      },
    });
  } catch (err) {
    console.error("Errore login:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
