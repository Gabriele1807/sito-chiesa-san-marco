import { NextResponse } from "next/server";
import { listUsers, updateUser, deleteUser, updateUserPassword, findUserByIdFull } from "@/lib/mongo/users";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { passwordPolicyError } from "@/lib/auth/password-rules";
import { supabaseAdmin } from "@/lib/supabase/server";
import { markAdminPasswordChangedByUsername } from "@/lib/mongo/admin-password-changes";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";

/**
 * GET /api/admin/utenti — Lista utenti normali (MongoDB)
 * Query params: page, limit, adminRequest
 */
export async function GET(request: Request) {
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const query = url.searchParams.get("q") || undefined;
  const roleFilter = url.searchParams.get("role") || undefined;
  const ageMin = url.searchParams.get("ageMin") || undefined;
  const ageMax = url.searchParams.get("ageMax") || undefined;
  const adminRequestFilter = url.searchParams.get("adminRequest") as "none" | "pending" | "approved" | "rejected" | null;

  try {
    const result = await listUsers({
      page,
      limit,
      query,
      roleFilter,
      ageMin,
      ageMax,
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
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID utente richiesto" }, { status: 400 });
    }

    const ALLOWED_ROLES = ["credente", "madre", "padre", "ospite_chiesa", "prete"];
    const ALLOWED_AGE_GROUPS = ["0-11", "12-18", "19-29", "30-45", "46-65", "65+"];

    if (body.role !== undefined && !ALLOWED_ROLES.includes(body.role)) {
      return NextResponse.json({ success: false, error: "Ruolo non valido" }, { status: 400 });
    }
    if (body.ageGroup !== undefined && !ALLOWED_AGE_GROUPS.includes(body.ageGroup)) {
      return NextResponse.json({ success: false, error: "Fascia d'età non valida" }, { status: 400 });
    }

    // Whitelist esplicita dei campi modificabili — username escluso intenzionalmente
    const safeData: Record<string, unknown> = {};
    for (const field of ["nome", "cognome", "chiesa"] as const) {
      if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].length > 200)) {
        return NextResponse.json({ success: false, error: `Campo ${field} non valido` }, { status: 400 });
      }
    }
    if (body.attivo !== undefined && typeof body.attivo !== "boolean") {
      return NextResponse.json({ success: false, error: "Campo attivo non valido" }, { status: 400 });
    }
    if (body.nome !== undefined) safeData.nome = body.nome;
    if (body.cognome !== undefined) safeData.cognome = body.cognome;
    if (body.role !== undefined) safeData.role = body.role;
    if (body.ageGroup !== undefined) safeData.ageGroup = body.ageGroup;
    if (body.chiesa !== undefined) safeData.chiesa = body.chiesa;
    if (body.attivo !== undefined) safeData.attivo = body.attivo;

    const updated = await updateUser(id, safeData);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    await recordAdminAction({
      action: "update",
      entity: "utenti",
      entityId: String(id),
      summary: `Utente @${updated.username}${body.attivo === false ? " (disattivato)" : body.attivo === true ? " (attivato)" : ""}`,
    });
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
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
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

    await recordAdminAction({ action: "delete", entity: "utenti", entityId: String(id), summary: `Utente n. ${id}` });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore DELETE utente:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/utenti — Reset password utente (solo superadmin)
 * Body: { id, newPassword }
 */
export async function PATCH(request: Request) {
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
    return NextResponse.json({ success: false, error: "Solo superadmin" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, newPassword } = body;

    if (!id || !newPassword) {
      return NextResponse.json({ success: false, error: "id e newPassword richiesti" }, { status: 400 });
    }
    const passwordError = passwordPolicyError(newPassword);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    const ok = await updateUserPassword(id, passwordHash);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    // Se l'utente ha anche un account admin su Supabase, aggiorna anche lì
    const fullUser = await findUserByIdFull(id);
    if (fullUser && fullUser.adminRequest === "approved") {
      await supabaseAdmin
        .from("admin_users")
        .update({ password_hash: passwordHash })
        .eq("username", fullUser.username);
      await markAdminPasswordChangedByUsername(fullUser.username);
    }

    await recordAdminAction({
      action: "update",
      entity: "utenti",
      entityId: String(id),
      summary: `Password reimpostata per @${fullUser?.username ?? id}`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore PATCH utente:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
