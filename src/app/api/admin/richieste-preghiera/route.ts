import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";
import {
  listPrayerRequests,
  archiveStalePrayerRequests,
  countPrayerRequestsByState,
  setPrayerRequestState,
  deletePrayerRequest,
  PRAYER_STATES,
  type PrayerState,
} from "@/lib/mongo/prayer-requests";
import { parseContentId } from "@/lib/admin/content-validation";

const STATE_LABELS: Record<PrayerState, string> = {
  nuova: "da leggere",
  letta: "letta",
  archiviata: "archiviata",
};

// Dati delicati (salute, fede, nomi di terzi): solo i superadmin.
function unauthorized() {
  return NextResponse.json(
    { error: "Solo i superadmin possono gestire le richieste di preghiera" },
    { status: 403 }
  );
}

/** GET /api/admin/richieste-preghiera?stato=nuova|letta|archiviata */
export async function GET(request: Request) {
  if (!(await requireSuperAdminSession())) return unauthorized();
  const stato = new URL(request.url).searchParams.get("stato") as PrayerState | null;
  await archiveStalePrayerRequests().catch(() => 0);
  const [richieste, counts] = await Promise.all([
    listPrayerRequests(stato && PRAYER_STATES.includes(stato) ? stato : undefined),
    countPrayerRequestsByState(),
  ]);
  return NextResponse.json({ richieste, counts });
}

/** PATCH { id, stato } — segna come letta, archivia o riapre. */
export async function PATCH(request: Request) {
  if (!(await requireSuperAdminSession())) return unauthorized();
  try {
    const body = await request.json();
    const id = parseContentId(body?.id);
    const stato = body?.stato as PrayerState;
    if (!id || !PRAYER_STATES.includes(stato)) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
    }
    const updated = await setPrayerRequestState(id, stato);
    if (!updated) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
    // Nel registro solo tipo e stato, non il testo né i nomi (dati personali).
    await recordAdminAction({
      action: "update",
      entity: "richieste-preghiera",
      entityId: id,
      summary: `Richiesta (${updated.tipo}) segnata come ${STATE_LABELS[stato]}`,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

/** DELETE ?id= */
export async function DELETE(request: Request) {
  if (!(await requireSuperAdminSession())) return unauthorized();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  const deleted = await deletePrayerRequest(id);
  if (!deleted) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  await recordAdminAction({
    action: "delete",
    entity: "richieste-preghiera",
    entityId: id,
    summary: "Richiesta di preghiera eliminata",
  });
  return NextResponse.json({ success: true });
}
