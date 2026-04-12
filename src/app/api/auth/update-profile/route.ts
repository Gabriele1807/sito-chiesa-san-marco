import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import {
  findUserByIdFull,
  updateUser,
  updateUserEmail,
  updateUserUsername,
  updateAdminRequest,
} from "@/lib/mongo/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserRole, AgeGroup, AdminRequestStatus } from "@/types";

const VALID_ROLES: UserRole[] = ["credente", "madre", "padre", "ospite_chiesa"];
const VALID_AGE_GROUPS: AgeGroup[] = ["0-11", "12-18", "19-29", "30-45", "46-65", "65+"];

/**
 * POST /api/auth/update-profile
 * Aggiorna il profilo dell'utente autenticato.
 *
 * Utente normale (user_session):
 *   Body: { nome?, cognome?, email?, username?, role?, ageGroup?, chiesa?, requestAdmin? }
 *
 * Admin (admin_session):
 *   Body: { nome?, cognome?, email?, username? }
 *   Ritorna: { success, admin: { id, username, nome, cognome, ruolo } }
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_session")?.value;
    const adminToken = cookieStore.get("admin_session")?.value;

    if (!userToken && !adminToken) {
      return NextResponse.json({ success: false, error: "Non autenticato" }, { status: 401 });
    }

    const body = await request.json();

    // ══════════════════════════════════════════════════
    // PERCORSO ADMIN
    // ══════════════════════════════════════════════════
    if (adminToken && !userToken) {
      const { nome, cognome, email, username } = body;

      // Valida sessione admin
      const { data: sessionRow } = await supabaseAdmin
        .from("admin_sessions")
        .select("expires_at, admin_user_id")
        .eq("session_token", adminToken)
        .single();

      if (!sessionRow || new Date(sessionRow.expires_at) < new Date()) {
        return NextResponse.json({ success: false, error: "Sessione admin scaduta" }, { status: 401 });
      }

      const adminUserId = sessionRow.admin_user_id as string;

      // Fetch current admin
      const { data: currentAdmin } = await supabaseAdmin
        .from("admin_users")
        .select("id, username, email, nome, cognome, ruolo")
        .eq("id", adminUserId)
        .eq("attivo", true)
        .single();

      if (!currentAdmin) {
        return NextResponse.json({ success: false, error: "Amministratore non trovato" }, { status: 404 });
      }

      // Validation
      if (email !== undefined) {
        if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
          return NextResponse.json({ success: false, error: "Email non valida" }, { status: 400 });
        }
        // Check email uniqueness
        if (email !== currentAdmin.email) {
          const { data: existing } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("email", email)
            .neq("id", adminUserId)
            .maybeSingle();
          if (existing) {
            return NextResponse.json({ success: false, error: "Email già in uso da un altro account" }, { status: 409 });
          }
        }
      }

      if (username !== undefined) {
        if (
          typeof username !== "string" ||
          username.length < 3 ||
          username.length > 30 ||
          !/^[a-zA-Z0-9_.-]+$/.test(username)
        ) {
          return NextResponse.json(
            { success: false, error: "Username non valido (3–30 caratteri, solo lettere, numeri, . _ -)" },
            { status: 400 }
          );
        }
        // Check username uniqueness
        if (username !== currentAdmin.username) {
          const { data: existing } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("username", username)
            .neq("id", adminUserId)
            .maybeSingle();
          if (existing) {
            return NextResponse.json({ success: false, error: "Username già in uso da un altro account" }, { status: 409 });
          }
        }
      }

      // Build update payload
      const adminUpdate: Record<string, string> = {};
      if (nome !== undefined && typeof nome === "string" && nome.trim()) adminUpdate.nome = nome.trim();
      if (cognome !== undefined && typeof cognome === "string" && cognome.trim()) adminUpdate.cognome = cognome.trim();
      if (email !== undefined && typeof email === "string") adminUpdate.email = email.trim();
      if (username !== undefined && typeof username === "string") adminUpdate.username = username.trim();

      if (Object.keys(adminUpdate).length === 0) {
        return NextResponse.json({ success: true, admin: currentAdmin });
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("admin_users")
        .update(adminUpdate)
        .eq("id", adminUserId)
        .select("id, username, nome, cognome, ruolo")
        .single();

      if (updateError || !updated) {
        console.error("Errore aggiornamento admin:", updateError);
        return NextResponse.json({ success: false, error: "Errore durante il salvataggio" }, { status: 500 });
      }

      return NextResponse.json({ success: true, admin: updated });
    }

    // ══════════════════════════════════════════════════
    // PERCORSO UTENTE NORMALE
    // ══════════════════════════════════════════════════
    const session = await validateUserSession(userToken!);
    if (!session) {
      return NextResponse.json({ success: false, error: "Sessione scaduta" }, { status: 401 });
    }

    const userId = session.userId;
    const { nome, cognome, email, username, role, ageGroup, chiesa, requestAdmin } = body;

    // ── Validation ─────────────────────────────────────────────
    if (email !== undefined) {
      if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
        return NextResponse.json({ success: false, error: "Email non valida" }, { status: 400 });
      }
    }

    if (username !== undefined) {
      if (
        typeof username !== "string" ||
        username.length < 3 ||
        username.length > 30 ||
        !/^[a-zA-Z0-9_.-]+$/.test(username)
      ) {
        return NextResponse.json(
          { success: false, error: "Username non valido (3–30 caratteri, solo lettere, numeri, . _ -)" },
          { status: 400 }
        );
      }
    }

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: "Ruolo non valido" }, { status: 400 });
    }

    if (ageGroup !== undefined && !VALID_AGE_GROUPS.includes(ageGroup)) {
      return NextResponse.json({ success: false, error: "Fascia d'età non valida" }, { status: 400 });
    }

    if (chiesa !== undefined && typeof chiesa !== "string") {
      return NextResponse.json({ success: false, error: "Nome chiesa non valido" }, { status: 400 });
    }

    // ── Fetch current user for adminRequest check ───────────────
    const currentUser = await findUserByIdFull(userId);
    if (!currentUser || !currentUser.attivo) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    // ── Apply email change (with uniqueness check) ──────────────
    if (email !== undefined && email !== currentUser.email) {
      const result = await updateUserEmail(userId, email);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }
    }

    // ── Apply username change (with uniqueness check) ────────────
    if (username !== undefined && username !== currentUser.username) {
      const result = await updateUserUsername(userId, username);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }
    }

    // ── Build scalar field update ────────────────────────────────
    const scalarUpdate: Parameters<typeof updateUser>[1] = {};
    if (nome !== undefined && typeof nome === "string" && nome.trim()) scalarUpdate.nome = nome.trim();
    if (cognome !== undefined && typeof cognome === "string" && cognome.trim()) scalarUpdate.cognome = cognome.trim();
    if (role !== undefined) scalarUpdate.role = role as UserRole;
    if (ageGroup !== undefined) scalarUpdate.ageGroup = ageGroup as AgeGroup;
    if (chiesa !== undefined) scalarUpdate.chiesa = typeof chiesa === "string" ? chiesa.trim() : undefined;

    if (Object.keys(scalarUpdate).length > 0) {
      await updateUser(userId, scalarUpdate);
    }

    // ── Admin request ─────────────────────────────────────────────
    if (requestAdmin === true) {
      const currentStatus: AdminRequestStatus = currentUser.adminRequest as AdminRequestStatus ?? "none";
      // Only allow if not already pending or approved
      if (currentStatus === "none" || currentStatus === "rejected") {
        await updateAdminRequest(userId, "pending");
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/auth/update-profile:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
