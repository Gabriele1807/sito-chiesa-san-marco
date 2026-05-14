/**
 * API Route: GET /api/admin/section-visibility
 * Legge tutte le configurazioni di visibilità delle sezioni.
 * Richiede: Admin o SuperAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";

export async function GET(req: NextRequest) {
  try {
    // TODO: Verificare se l'utente è admin o superadmin
    // Per ora, permettere l'accesso a chiunque (sviluppo)
    
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
