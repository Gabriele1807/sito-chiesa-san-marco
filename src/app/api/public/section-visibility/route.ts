/**
 * API pubblica Route: GET /api/public/section-visibility
 * Legge le configurazioni di visibilità delle sezioni.
 * Usato dal client per determinare quali sezioni renderizzare.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";

export async function GET(req: NextRequest) {
  try {
    const visibilities = await getAllSectionVisibilities();
    return NextResponse.json({ success: true, data: visibilities });
  } catch (error) {
    console.error("[GET /api/public/section-visibility]", error);
    return NextResponse.json(
      { success: false, error: "Errore nel recupero della configurazione visibilità" },
      { status: 500 }
    );
  }
}
