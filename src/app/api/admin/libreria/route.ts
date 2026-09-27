import { NextResponse } from "next/server";
import { getLibri, addLibro, updateLibro, deleteLibro } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";
import { requireAdminSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";
import { validateContent, parseContentId } from "@/lib/admin/content-validation";
import type { TestoSacro } from "@/types";

export async function GET() {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return NextResponse.json(await getLibri());
}

export async function POST(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const parsed = validateContent("libreria", await request.json(), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const libro = await addLibro(parsed.data as Omit<TestoSacro, "id">);
    revalidatePublicContent("libreria");
    await recordAdminAction({
      action: "create",
      entity: "libreria",
      entityId: libro.id,
      summary: `Libro "${libro.titolo}"`,
    });
    return NextResponse.json(libro, { status: 201 });
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
    const parsed = validateContent("libreria", body, "update");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const updated = await updateLibro(id, parsed.data as Partial<TestoSacro>);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("libreria");
    await recordAdminAction({
      action: "update",
      entity: "libreria",
      entityId: id,
      summary: `Libro "${updated.titolo}"`,
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
    const deleted = await deleteLibro(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("libreria");
    await recordAdminAction({ action: "delete", entity: "libreria", entityId: id, summary: `Libro n. ${id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
