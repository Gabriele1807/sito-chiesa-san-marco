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
import { logAdminAction } from "@/lib/mongo/audit-log";

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
      await logAdminAction(adminUser, {
        action: "revoke",
        entity: "richieste-admin",
        entityId: userId,
        summary: `Accesso admin revocato a @${user.username}`,
      });
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
      await logAdminAction(adminUser, {
        action: "reject",
        entity: "richieste-admin",
        entityId: userId,
        summary: `Richiesta admin di @${user.username} rifiutata`,
      });
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
        // Il collegamento admin ↔ utente passa dallo username: accettiamo il
        // record esistente solo se è davvero di questa persona (stessa
        // email), altrimenti l'utente verrebbe legato all'account admin di
        // qualcun altro (password sincronizzate, revoca sull'account sbagliato).
        const { data: existingAdmin } = await supabaseAdmin
          .from("admin_users")
          .select("email")
          .eq("username", user.username)
          .maybeSingle();
        const sameOwner =
          existingAdmin?.email &&
          String(existingAdmin.email).trim().toLowerCase() === user.email.trim().toLowerCase();
        if (!sameOwner) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Esiste già un amministratore con questo username o email che non corrisponde all'utente. L'utente deve cambiare username prima dell'approvazione.",
            },
            { status: 409 }
          );
        }
        // Stessa persona: tipicamente un admin revocato (la revoca lascia il
        // record con attivo=false) e poi riapprovato. Va riattivato con il
        // ruolo richiesto, altrimenti l'approvazione risulterebbe riuscita ma
        // l'utente resterebbe senza accesso admin.
        const { error: reactivateError } = await supabaseAdmin
          .from("admin_users")
          .update({ attivo: true, ruolo: adminRuolo })
          .eq("username", user.username);
        if (reactivateError) {
          console.error("Errore riattivazione admin su Supabase:", reactivateError);
          return NextResponse.json(
            { success: false, error: "Errore durante la riattivazione dell'amministratore" },
            { status: 500 }
          );
        }
        await updateAdminRequest(userId, "approved");
        await logAdminAction(adminUser, {
          action: "approve",
          entity: "richieste-admin",
          entityId: userId,
          summary: `@${user.username} riattivato come admin`,
        });
        return NextResponse.json({
          success: true,
          message: "Richiesta approvata (account admin esistente riattivato)",
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
    await logAdminAction(adminUser, {
      action: "approve",
      entity: "richieste-admin",
      entityId: userId,
      summary: `@${user.username} promosso a ${adminRuolo}`,
    });

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
