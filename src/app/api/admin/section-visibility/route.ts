/**
 * API Route: GET /api/admin/section-visibility
 * Legge tutte le configurazioni di visibilità delle sezioni.
 * Richiede: Admin o SuperAdmin
 */

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";

export async function GET() {
  try {
    const adminUser = await requireAdminSession();
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
