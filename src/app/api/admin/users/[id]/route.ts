/**
 * API per singolo admin user.
 *
 * PUT    → modifica admin (solo superadmin)
 * DELETE → elimina admin (solo superadmin, non se stesso)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";

async function requireSuperAdmin() {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  const userId = h.get("x-admin-user-id");
  return { isSuperAdmin: ruolo === "superadmin", currentUserId: userId };
}

// ---------- PUT: modifica admin ----------
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isSuperAdmin } = await requireSuperAdmin();
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
      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: "La password deve essere di almeno 8 caratteri" },
          { status: 400 }
        );
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore eliminazione admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
