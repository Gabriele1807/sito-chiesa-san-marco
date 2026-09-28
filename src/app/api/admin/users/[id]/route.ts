/**
 * API per singolo admin user.
 *
 * PUT    → modifica admin (solo superadmin)
 * DELETE → elimina admin (solo superadmin, non se stesso)
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import { passwordPolicyError } from "@/lib/auth/password-rules";
import { requireSuperAdminSession, reissueAdminSessionCookie } from "@/lib/auth/session";
import { markAdminPasswordChanged } from "@/lib/mongo/admin-password-changes";
import { deleteAllUserSessions } from "@/lib/mongo/sessions";
import { findUserByUsername } from "@/lib/mongo/users";
import { recordAdminAction } from "@/lib/mongo/audit-log";

async function requireSuperAdmin() {
  const adminUser = await requireSuperAdminSession();
  return {
    isSuperAdmin: adminUser?.ruolo === "superadmin",
    currentUserId: adminUser?.id ?? null,
  };
}

// ---------- PUT: modifica admin ----------
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isSuperAdmin, currentUserId } = await requireSuperAdmin();
  if (!isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: "Solo i superadmin possono modificare admin" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { email, nome, cognome, ruolo, password } = body;

    // Campi da aggiornare
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (email !== undefined) updates.email = email || null;
    if (nome) updates.nome = nome;
    if (cognome) updates.cognome = cognome;
    if (ruolo && ["superadmin", "admin"].includes(ruolo)) updates.ruolo = ruolo;

    // Se viene fornita una nuova password, hasharla
    if (password) {
      const passwordError = passwordPolicyError(password);
      if (passwordError) {
        return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
      }
      updates.password_hash = await hashPassword(password);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nessun campo da aggiornare" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .select("id, username, email, nome, cognome, ruolo, attivo, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Admin non trovato" },
        { status: 404 }
      );
    }

    if (updates.password_hash) {
      // Nuova password: chiude le sessioni aperte con quella vecchia
      // (resta aperta solo quella del superadmin, se ha cambiato la propria).
      await markAdminPasswordChanged(data.id);
      // Anche le sessioni dell'account utente collegato (stesso username):
      // altrimenti /api/auth/me ricreerebbe una sessione admin partendo da lì.
      const linkedUser = await findUserByUsername(data.username);
      if (linkedUser) await deleteAllUserSessions(linkedUser._id);
      if (data.id === currentUserId) await reissueAdminSessionCookie(request, data.id);
    }

    await recordAdminAction({
      action: "update",
      entity: "admin",
      entityId: data.id,
      summary: `Account admin @${data.username}${updates.password_hash ? " (password cambiata)" : ""}`,
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Errore modifica admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}

// ---------- DELETE: elimina admin ----------
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isSuperAdmin, currentUserId } = await requireSuperAdmin();
  if (!isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: "Solo i superadmin possono eliminare admin" },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Non puoi eliminare te stesso
  if (id === currentUserId) {
    return NextResponse.json(
      { success: false, error: "Non puoi eliminare il tuo account" },
      { status: 400 }
    );
  }

  try {
    // Con JWT stateless basta eliminare l'utente: le sessioni residue
    // diventano invalide non appena l'account non esiste piu`.
    const { error } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await recordAdminAction({ action: "delete", entity: "admin", entityId: id, summary: `Account admin n. ${id}` });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore eliminazione admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
