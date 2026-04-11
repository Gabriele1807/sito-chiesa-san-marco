import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById } from "@/lib/mongo/users";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/auth/me
 * Ritorna le info dell'utente corrente (normal user da MongoDB).
 * Per admin, il client usa già localStorage + header middleware.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const adminToken = cookieStore.get("admin_session")?.value;

    // Se c'è una sessione admin, ritorna il tipo admin (senza dettagli - quelli vengono dal localStorage)
    if (adminToken) {
      return NextResponse.json({
        success: true,
        type: "admin",
        authenticated: true,
      });
    }

    if (!token) {
      return NextResponse.json({
        success: true,
        type: "guest",
        authenticated: false,
      });
    }

    const session = await validateUserSession(token);
    if (!session) {
      // Sessione scaduta, pulisci cookie
      const response = NextResponse.json({
        success: true,
        type: "guest",
        authenticated: false,
      });
      response.cookies.delete("user_session");
      return response;
    }

    const user = await findUserById(session.userId);
    if (!user || !user.attivo) {
      return NextResponse.json({
        success: true,
        type: "guest",
        authenticated: false,
      });
    }

    // Auto-promozione: se la richiesta admin è stata approvata, crea sessione admin
    if (user.adminRequest === "approved") {
      const { data: adminUser } = await supabaseAdmin
        .from("admin_users")
        .select("id, username, nome, cognome, ruolo")
        .eq("username", user.username)
        .eq("attivo", true)
        .single();

      if (adminUser) {
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await supabaseAdmin.from("admin_sessions").insert({
          admin_user_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        const response = NextResponse.json({
          success: true,
          type: "admin",
          authenticated: true,
          admin: {
            id: adminUser.id,
            username: adminUser.username,
            nome: adminUser.nome,
            cognome: adminUser.cognome,
            ruolo: adminUser.ruolo,
          },
        });

        response.cookies.set("admin_session", sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 24 * 60 * 60,
        });

        return response;
      }
    }

    return NextResponse.json({
      success: true,
      type: "user",
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        nome: user.nome,
        cognome: user.cognome,
        role: user.role,
        ageGroup: user.ageGroup,
        isAdmin: false,
        adminRequest: user.adminRequest,
      },
    });
  } catch (err) {
    console.error("Errore GET /api/auth/me:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
