import { NextResponse, after } from "next/server";
import { startEmailVerification, localeFromRequest } from "@/lib/auth/email-verification";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import {
  findUserByIdFull,
  updateUser,
  updateUserEmail,
  updateUserUsername,
  updateAdminRequest,
  findUserByUsername,
  updateSuperAdminRequest,
} from "@/lib/mongo/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserRole, AgeGroup, AdminRequestStatus } from "@/types";
import { validateSession } from "@/lib/auth/session";
import {
  normalizeUsername,
  isUsernameTaken,
  findLinkedAdminId,
  USERNAME_INVALID_ERROR,
  USERNAME_TAKEN_ERROR,
} from "@/lib/auth/username";

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
      const { nome, cognome, email, username, requestSuperAdmin } = body;

      // Valida sessione admin
      const adminSession = await validateSession(adminToken);
      if (!adminSession) {
        return NextResponse.json({ success: false, error: "Sessione admin scaduta" }, { status: 401 });
      }

      const adminUserId = adminSession.id;

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

      const mongoUser = await findUserByUsername(currentAdmin.username);

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

      let newAdminUsername: string | undefined;
      if (username !== undefined && username !== currentAdmin.username) {
        const normalized = normalizeUsername(username);
        if (!normalized) {
          return NextResponse.json({ success: false, error: USERNAME_INVALID_ERROR }, { status: 400 });
        }
        if (normalized !== currentAdmin.username) {
          // Unicità su admin E utenti, escludendo questo admin e il suo
          // utente MongoDB collegato (stesso username).
          const taken = await isUsernameTaken(normalized, {
            adminId: adminUserId,
            userId: mongoUser?._id,
          });
          if (taken) {
            return NextResponse.json({ success: false, error: USERNAME_TAKEN_ERROR }, { status: 409 });
          }
          newAdminUsername = normalized;
        }
      }

      // Build update payload
      const adminUpdate: Record<string, string> = {};
      if (nome !== undefined && typeof nome === "string" && nome.trim()) adminUpdate.nome = nome.trim();
      if (cognome !== undefined && typeof cognome === "string" && cognome.trim()) adminUpdate.cognome = cognome.trim();
      if (email !== undefined && typeof email === "string") adminUpdate.email = email.trim();
      if (newAdminUsername) adminUpdate.username = newAdminUsername;

      if (requestSuperAdmin === true && currentAdmin.ruolo === "admin" && mongoUser) {
        const currentStatus = mongoUser.superAdminRequest ?? "none";
        if (currentStatus === "none" || currentStatus === "rejected") {
          await updateSuperAdminRequest(mongoUser._id as string, "pending");
        }
      }

      if (Object.keys(adminUpdate).length === 0) {
        return NextResponse.json({
          success: true,
          admin: {
            ...currentAdmin,
            superAdminRequest:
              currentAdmin.ruolo === "superadmin"
                ? "approved"
                : (mongoUser?.superAdminRequest ?? "none"),
          },
        });
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

      // Admin e utente MongoDB sono collegati tramite username: rinominiamo
      // anche l'utente, altrimenti me/iscrizioni/change-password perdono il
      // collegamento.
      if (newAdminUsername && mongoUser) {
        const renamed = await updateUserUsername(mongoUser._id, newAdminUsername);
        if (!renamed.success) {
          console.error("[update-profile] rinomina utente collegato all'admin fallita:", renamed.error);
        }
      }

      const refreshedMongoUser = await findUserByUsername(updated.username);

      return NextResponse.json({
        success: true,
        admin: {
          ...updated,
          superAdminRequest:
            updated.ruolo === "superadmin"
              ? "approved"
              : (refreshedMongoUser?.superAdminRequest ?? "none"),
        },
      });
    }

    // ══════════════════════════════════════════════════
    // PERCORSO UTENTE NORMALE
    // ══════════════════════════════════════════════════
    const session = await validateUserSession(userToken!);
    if (!session) {
      return NextResponse.json({ success: false, error: "Sessione scaduta" }, { status: 401 });
    }

    const userId = session.userId;
    const { nome, cognome, email: rawEmail, username, role, ageGroup, chiesa, requestAdmin } = body;

    // ── Validation ─────────────────────────────────────────────
    // Stessa normalizzazione di register/login/forgot-password: un'email
    // salvata con maiuscole o spazi non verrebbe più trovata da quei flussi
    // (lookup esatto), e l'unicità sarebbe aggirabile cambiando le maiuscole.
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;
    if (email !== undefined) {
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return NextResponse.json({ success: false, error: "Email non valida" }, { status: 400 });
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

    // ── Username: validazione e unicità prima di qualunque scrittura ──
    let newUsername: string | null = null;
    let linkedAdminId: string | null = null;
    if (username !== undefined && username !== currentUser.username) {
      const normalized = normalizeUsername(username);
      if (!normalized) {
        return NextResponse.json({ success: false, error: USERNAME_INVALID_ERROR }, { status: 400 });
      }
      if (normalized !== currentUser.username) {
        // Un utente promosso admin ha un record admin_users con lo stesso
        // username: va escluso dal controllo e rinominato insieme.
        linkedAdminId =
          currentUser.adminRequest === "approved"
            ? await findLinkedAdminId(currentUser.username)
            : null;
        const taken = await isUsernameTaken(normalized, {
          userId,
          adminId: linkedAdminId ?? undefined,
        });
        if (taken) {
          return NextResponse.json({ success: false, error: USERNAME_TAKEN_ERROR }, { status: 409 });
        }
        newUsername = normalized;
      }
    }

    // ── Apply email change (with uniqueness check) ──────────────
    if (email !== undefined && email !== currentUser.email) {
      const result = await updateUserEmail(userId, email);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }
      // Il nuovo indirizzo non è verificato: parte subito il link di conferma.
      after(() =>
        startEmailVerification(userId, email, localeFromRequest(request)).then(
          () => undefined,
          (err) => console.error("[update-profile] link di verifica non inviato", err instanceof Error ? err.message : err)
        )
      );
    }

    // ── Apply username change (checks done above, before any write) ──
    if (newUsername) {
      const result = await updateUserUsername(userId, newUsername);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }
      if (linkedAdminId) {
        const { error: adminRenameError } = await supabaseAdmin
          .from("admin_users")
          .update({ username: newUsername })
          .eq("id", linkedAdminId);
        if (adminRenameError) {
          console.error("[update-profile] rinomina admin collegato fallita:", adminRenameError.message);
        }
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
