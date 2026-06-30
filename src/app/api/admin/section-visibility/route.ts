/**
 * API Route: GET /api/admin/section-visibility
 * Legge tutte le configurazioni di visibilità delle sezioni.
 * Richiede: Admin o SuperAdmin
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth/session";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";

async function requireAdminUser() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_session")?.value;
  if (!adminToken) return null;

  const adminUser = await validateSession(adminToken);
  if (!adminUser || !adminUser.attivo) return null;
  if (adminUser.ruolo !== "admin" && adminUser.ruolo !== "superadmin") return null;

  return adminUser;
}

export async function GET() {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
    }

    const visibilities = await getAllSectionVisibilities();
    return NextResponse.json({ success: true, data: visibilities });
  } catch (error) {
    console.error("[GET /api/admin/section-visibility]", error);
    return NextResponse.json(
      { success: false, error: "Errore nel recupero delle visibilità" },
      { status: 500 }
    );
  }
}
