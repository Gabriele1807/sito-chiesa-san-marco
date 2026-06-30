import { NextResponse } from "next/server";
import {
  getPendingAdminRequests,
  updateAdminRequest,
  findUserById,
  findUserByIdFull,
  updateUser,
} from "@/lib/mongo/users";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import { requireSuperAdminSession } from "@/lib/auth/session";

/**
 * GET /api/admin/richieste-admin — Lista richieste admin pendenti
 * Solo superadmin.
 */
export async function GET() {
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
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
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
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

    if (action !== "approve" && action !== "reject" && action !== "promote" && action !== "revoke") {
      return NextResponse.json(
        { success: false, error: "action deve essere 'approve', 'reject', 'promote' o 'revoke'" },
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

    // ---- Revoca admin ----
    if (action === "revoke") {
      // Disattiva su Supabase
      await supabaseAdmin
        .from("admin_users")
        .update({ attivo: false })
        .eq("username", user.username);
      // Aggiorna MongoDB
      await updateUser(userId, { adminRequest: "none" });
      return NextResponse.json({ success: true, message: "Accesso admin revocato" });
    }

    // Solo 'approve' richiede richiesta pendente; 'promote' bypassa il controllo
    if (action === "reject") {
      if (user.adminRequest !== "pending") {
        return NextResponse.json(
          { success: false, error: "Nessuna richiesta admin pendente per questo utente" },
          { status: 400 }
        );
      }
      await updateAdminRequest(userId, "rejected");
      return NextResponse.json({ success: true, message: "Richiesta rifiutata" });
    }

    // ---- Approvazione / Promozione diretta ----
    const adminRuolo = targetRuolo === "superadmin" ? "superadmin" : "admin";

    // Recupera il profilo completo (con passwordHash) per copiare la password reale
    const fullUser = await findUserByIdFull(userId);
    let passwordHash: string;
    if (fullUser?.passwordHash) {
      // Usa la stessa password dell'utente così potrà accedere come admin con le stesse credenziali
      passwordHash = fullUser.passwordHash;
    } else {
      // Fallback: genera password temporanea (non dovrebbe succedere)
      const tempPassword = crypto.randomUUID().slice(0, 16);
      passwordHash = await hashPassword(tempPassword);
    }

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
      message: `Utente ${user.username} promosso a ${adminRuolo}.`,
    });
  } catch (err) {
    console.error("Errore POST richieste admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
