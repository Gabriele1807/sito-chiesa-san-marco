import { NextResponse } from "next/server";
import {
  afterWrite,
  badRequest,
  readJson,
  requireCalendarioAdmin,
  unauthorized,
} from "@/lib/admin/calendario-route";
import {
  CALENDARIO_SECTION_ID,
  ensureCalendarioSeeded,
  getImpostazioni,
  setImpostazioni,
  validateImpostazioni,
} from "@/lib/mongo/calendario";
import { getSectionVisibility } from "@/lib/mongo/visibility";
import { DEFAULT_LOCATION } from "@/lib/calendario/service";

/**
 * GET — località predefinita e visibilità della pagina pubblica. La
 * visibilità si modifica con l'API esistente
 * PUT /api/admin/section-visibility/calendario { isActive }.
 */
export async function GET() {
  if (!(await requireCalendarioAdmin("calendario.read"))) return unauthorized();
  try {
    await ensureCalendarioSeeded();
    const [impostazioni, visibility] = await Promise.all([
      getImpostazioni(),
      getSectionVisibility(CALENDARIO_SECTION_ID),
    ]);
    return NextResponse.json({
      localita: impostazioni?.localita ?? DEFAULT_LOCATION,
      updatedAt: impostazioni?.updatedAt,
      updatedBy: impostazioni?.updatedBy,
      visibile: visibility?.isActive ?? true,
      sectionId: CALENDARIO_SECTION_ID,
    });
  } catch {
    return NextResponse.json({ error: "Database non raggiungibile" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const parsed = validateImpostazioni(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  try {
    const saved = await setImpostazioni(parsed.data, admin.username);
    await afterWrite(
      admin,
      "update",
      "impostazioni",
      `Località predefinita "${saved.localita.name}"`
    );
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }
}
