/**
 * API per gestione admin users.
 *
 * GET  → lista tutti gli admin (solo superadmin)
 * POST → crea un nuovo admin (solo superadmin)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";

/** Verifica che chi chiama sia superadmin (dal header impostato dal middleware). */
async function requireSuperAdmin() {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  return ruolo === "superadmin";
}

// ---------- GET: lista admin ----------
export async function GET() {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json(
      { success: false, error: "Solo i superadmin possono gestire gli admin" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, email, nome, cognome, ruolo, attivo, ultimo_accesso, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// ---------- POST: crea admin ----------
export async function POST(request: Request) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json(
      { success: false, error: "Solo i superadmin possono creare admin" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { username, email, password, nome, cognome, ruolo } = body;

    // Validazione base
    if (!username || !password || !nome || !cognome) {
      return NextResponse.json(
        { success: false, error: "Campi obbligatori: username, password, nome, cognome" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "La password deve essere di almeno 8 caratteri" },
        { status: 400 }
      );
    }

    if (ruolo && !["superadmin", "admin"].includes(ruolo)) {
      return NextResponse.json(
        { success: false, error: "Ruolo non valido (superadmin | admin)" },
        { status: 400 }
      );
    }

    // Controlla username duplicato
    const { data: existing } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username già in uso" },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .insert({
        username,
        email: email || null,
        password_hash,
        nome,
        cognome,
        ruolo: ruolo || "admin",
      })
      .select("id, username, email, nome, cognome, ruolo, attivo, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("Errore creazione admin:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
