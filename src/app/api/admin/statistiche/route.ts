import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminStatistics } from "@/lib/admin/statistics";

/** GET /api/admin/statistiche — conteggi aggregati per il pannello admin. */
export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    return NextResponse.json(await getAdminStatistics());
  } catch (err) {
    console.error("Errore statistiche admin:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Errore del server" }, { status: 500 });
  }
}
