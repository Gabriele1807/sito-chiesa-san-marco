import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { listUsers, updateUser, deleteUser } from "@/lib/mongo/users";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * GET /api/admin/utenti — Lista utenti normali (MongoDB)
 * Query params: page, limit, adminRequest
 */
export async function GET(request: Request) {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  if (!ruolo || !hasPermission(ruolo, "admin.read")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const adminRequestFilter = url.searchParams.get("adminRequest") as "none" | "pending" | "approved" | "rejected" | null;

  try {
    const result = await listUsers({
      page,
      limit,
      adminRequestFilter: adminRequestFilter || undefined,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Errore GET utenti:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/utenti — Aggiorna utente normale
 * Body: { id, nome?, cognome?, role?, ageGroup?, chiesa?, attivo? }
 */
export async function PUT(request: Request) {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  if (!ruolo || !hasPermission(ruolo, "admin.write")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID utente richiesto" }, { status: 400 });
    }

    const updated = await updateUser(id, data);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Errore PUT utente:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/utenti — Elimina utente normale
 * Body: { id }
 */
export async function DELETE(request: Request) {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  if (!ruolo || !hasPermission(ruolo, "admin.write")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID utente richiesto" }, { status: 400 });
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore DELETE utente:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
