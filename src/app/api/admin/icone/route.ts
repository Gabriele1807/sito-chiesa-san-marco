import { NextResponse } from "next/server";
import { getIcone, addIcona, updateIcona, deleteIcona } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";
import { requireAdminSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";
import { validateContent, parseContentId } from "@/lib/admin/content-validation";
import type { Icona } from "@/types";

export async function GET() {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return NextResponse.json(await getIcone());
}

export async function POST(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const parsed = validateContent("icone", await request.json(), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const icona = await addIcona(parsed.data as Omit<Icona, "id">);
    revalidatePublicContent("icone");
    await recordAdminAction({
      action: "create",
      entity: "icone",
      entityId: icona.id,
      summary: `Icona "${icona.nome}"`,
    });
    return NextResponse.json(icona, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const id = parseContentId(body?.id);
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const parsed = validateContent("icone", body, "update");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const updated = await updateIcona(id, parsed.data as Partial<Icona>);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("icone");
    await recordAdminAction({
      action: "update",
      entity: "icone",
      entityId: id,
      summary: `Icona "${updated.nome}"`,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const deleted = await deleteIcona(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("icone");
    await recordAdminAction({ action: "delete", entity: "icone", entityId: id, summary: `Icona n. ${id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
