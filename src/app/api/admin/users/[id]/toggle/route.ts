/**
 * API per attivare/disattivare un admin.
 *
 * PATCH → toggle attivo/disattivo (solo superadmin, non se stesso)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

async function requireSuperAdmin() {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  const userId = h.get("x-admin-user-id");
  return { isSuperAdmin: ruolo === "superadmin", currentUserId: userId };
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isSuperAdmin, currentUserId } = await requireSuperAdmin();
  if (!isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: "Solo i superadmin possono attivare/disattivare admin" },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Non puoi disattivare te stesso
  if (id === currentUserId) {
    return NextResponse.json(
      { success: false, error: "Non puoi disattivare il tuo account" },
      { status: 400 }
    );
  }

  try {
    // Leggi stato attuale
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("admin_users")
      .select("id, attivo")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, error: "Admin non trovato" },
        { status: 404 }
      );
    }

    const nuovoStato = !user.attivo;

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update({ attivo: nuovoStato })
      .eq("id", id)
      .select("id, username, nome, cognome, attivo")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Errore toggle admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
