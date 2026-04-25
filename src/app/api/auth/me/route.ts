import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById, findUserByUsername } from "@/lib/mongo/users";
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

    // Se c'è una sessione admin, validala lato DB e ritorna sempre dati aggiornati
    if (adminToken) {
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("admin_sessions")
        .select(
          `
            expires_at,
            admin_user_id,
            admin_users (
              id,
              username,
              nome,
              cognome,
              ruolo,
              attivo
            )
          `
        )
        .eq("session_token", adminToken)
        .single();

      if (sessionError || !session) {
        const response = NextResponse.json({
          success: true,
          type: "guest",
          authenticated: false,
        });
        response.cookies.delete("admin_session");
        return response;
      }

      if (new Date(session.expires_at) < new Date()) {
        await supabaseAdmin
          .from("admin_sessions")
          .delete()
          .eq("session_token", adminToken);

        const response = NextResponse.json({
          success: true,
          type: "guest",
          authenticated: false,
        });
        response.cookies.delete("admin_session");
        return response;
      }

      const rawAdminUser = session.admin_users as unknown;
      const adminUser = (Array.isArray(rawAdminUser) ? rawAdminUser[0] : rawAdminUser) as {
        id: string;
        username: string;
        nome: string;
        cognome: string;
        ruolo: "superadmin" | "admin";
        attivo: boolean;
      } | null;

      if (!adminUser || !adminUser.attivo) {
        const response = NextResponse.json({
          success: true,
          type: "guest",
          authenticated: false,
        });
        response.cookies.delete("admin_session");
        return response;
      }

      const relatedUser = await findUserByUsername(adminUser.username);
      const superAdminRequest = adminUser.ruolo === "superadmin"
        ? "approved"
        : relatedUser?.superAdminRequest ?? "none";

      return NextResponse.json({
        success: true,
        type: "admin",
        authenticated: true,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          nome: adminUser.nome,
          cognome: adminUser.cognome,
          ruolo: adminUser.ruolo,
          isAdmin: true,
          superAdminRequest,
        },
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
            isAdmin: true,
            superAdminRequest: adminUser.ruolo === "superadmin" ? "approved" : "none",
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
        chiesa: user.chiesa,
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
