import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById, findUserByUsername } from "@/lib/mongo/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSession, validateSession } from "@/lib/auth/session";

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
      const adminUser = await validateSession(adminToken);
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
        const { token: sessionToken } = await createSession(adminUser.id, new Request(requestUrlFromHeaders()), false);

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

function requestUrlFromHeaders() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
