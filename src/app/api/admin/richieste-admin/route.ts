import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getPendingAdminRequests,
  updateAdminRequest,
  findUserById,
} from "@/lib/mongo/users";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";

/**
 * GET /api/admin/richieste-admin — Lista richieste admin pendenti
 * Solo superadmin.
 */
export async function GET() {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  if (!ruolo || !isSuperAdmin(ruolo)) {
    return NextResponse.json({ success: false, error: "Solo superadmin" }, { status: 403 });
  }

  try {
    const requests = await getPendingAdminRequests();
    return NextResponse.json({ success: true, data: requests });
  } catch (err) {
    console.error("Errore GET richieste admin:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * POST /api/admin/richieste-admin — Approva o rifiuta una richiesta admin
 * Body: { userId, action: "approve" | "reject", ruolo?: "admin" | "superadmin" }
 * Solo superadmin.
 *
 * Se approvata:
 * 1. Crea l'utente in admin_users su Supabase
 * 2. Aggiorna lo status su MongoDB
 */
export async function POST(request: Request) {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  if (!ruolo || !isSuperAdmin(ruolo)) {
    return NextResponse.json({ success: false, error: "Solo superadmin" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action, ruolo: targetRuolo } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "userId e action richiesti" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { success: false, error: "action deve essere 'approve' o 'reject'" },
        { status: 400 }
      );
    }

    // Trova l'utente su MongoDB
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utente non trovato" },
        { status: 404 }
      );
    }

    if (user.adminRequest !== "pending") {
      return NextResponse.json(
        { success: false, error: "Nessuna richiesta admin pendente per questo utente" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      await updateAdminRequest(userId, "rejected");
      return NextResponse.json({ success: true, message: "Richiesta rifiutata" });
    }

    // ---- Approvazione ----
    const adminRuolo = targetRuolo === "superadmin" ? "superadmin" : "admin";

    // Genera una password temporanea per l'account admin su Supabase
    // L'utente dovrà cambiarla al primo accesso admin (o usare le stesse credenziali)
    const tempPassword = crypto.randomUUID().slice(0, 16);
    const passwordHash = await hashPassword(tempPassword);

    // Crea utente in Supabase admin_users
    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        username: user.username,
        email: user.email,
        password_hash: passwordHash,
        nome: user.nome,
        cognome: user.cognome,
        ruolo: adminRuolo,
        attivo: true,
      });

    if (insertError) {
      // Se l'utente esiste già su Supabase (username o email duplicati)
      if (insertError.message.includes("duplicate") || insertError.code === "23505") {
        // Aggiorna solo lo status su MongoDB
        await updateAdminRequest(userId, "approved");
        return NextResponse.json({
          success: true,
          message: "Richiesta approvata (utente admin già esistente su Supabase)",
        });
      }
      console.error("Errore creazione admin su Supabase:", insertError);
      return NextResponse.json(
        { success: false, error: `Errore creazione admin: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Aggiorna status su MongoDB
    await updateAdminRequest(userId, "approved");

    return NextResponse.json({
      success: true,
      message: `Richiesta approvata. L'utente ${user.username} è ora ${adminRuolo}. Password temporanea: ${tempPassword}`,
      tempPassword,
    });
  } catch (err) {
    console.error("Errore POST richieste admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
