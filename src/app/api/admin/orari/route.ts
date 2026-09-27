import { NextResponse } from "next/server";
import { getOrari, addOrario, updateOrario, deleteOrario } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";
import { requireAdminSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";
import { validateContent } from "@/lib/admin/content-validation";
import type { OrarioSettimanale } from "@/types";

export async function GET() {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return NextResponse.json(await getOrari());
}

export async function POST(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const parsed = validateContent("orari", await request.json(), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const orario = await addOrario(parsed.data as unknown as OrarioSettimanale);
    revalidatePublicContent("orari");
    await recordAdminAction({ action: "create", entity: "orari", entityId: orario.giorno, summary: `Orari di ${orario.giorno}` });
    return NextResponse.json(orario, { status: 201 });
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
    // Il giorno identifica il documento: entrambi i campi sono obbligatori.
    const parsed = validateContent("orari", await request.json(), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const data = parsed.data as unknown as OrarioSettimanale;
    const updated = await updateOrario(data.giorno, data);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("orari");
    await recordAdminAction({ action: "update", entity: "orari", entityId: data.giorno, summary: `Orari di ${data.giorno}` });
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
    const giorno = searchParams.get("giorno");
    if (!giorno) return NextResponse.json({ error: "Giorno mancante" }, { status: 400 });
    const deleted = await deleteOrario(giorno);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("orari");
    await recordAdminAction({ action: "delete", entity: "orari", entityId: giorno, summary: `Orari di ${giorno}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
