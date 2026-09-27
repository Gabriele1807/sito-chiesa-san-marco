import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";
import {
  listAvvisi,
  createAvviso,
  updateAvviso,
  deleteAvviso,
  validateAvviso,
  type AvvisoInput,
} from "@/lib/mongo/announcements";
import { parseContentId } from "@/lib/admin/content-validation";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";

function unauthorized() {
  return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
}

export async function GET() {
  if (!(await requireAdminSession())) return unauthorized();
  return NextResponse.json(await listAvvisi());
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return unauthorized();
  try {
    const parsed = validateAvviso(await request.json(), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const avviso = await createAvviso(parsed.data as AvvisoInput);
    revalidatePublicContent("avvisi");
    await recordAdminAction({
      action: "create",
      entity: "avvisi",
      entityId: avviso.id,
      summary: `Avviso "${avviso.titolo}"`,
    });
    return NextResponse.json(avviso, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdminSession())) return unauthorized();
  try {
    const body = await request.json();
    const id = parseContentId(body?.id);
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const parsed = validateAvviso(body, "update");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const updated = await updateAvviso(id, parsed.data);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("avvisi");
    await recordAdminAction({
      action: "update",
      entity: "avvisi",
      entityId: id,
      summary: `Avviso "${updated.titolo}"`,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdminSession())) return unauthorized();
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const deleted = await deleteAvviso(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("avvisi");
    await recordAdminAction({
      action: "delete",
      entity: "avvisi",
      entityId: id,
      summary: `Avviso n. ${id.slice(0, 8)}`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
