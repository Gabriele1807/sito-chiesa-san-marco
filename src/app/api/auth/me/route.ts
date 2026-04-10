import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById } from "@/lib/mongo/users";

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
