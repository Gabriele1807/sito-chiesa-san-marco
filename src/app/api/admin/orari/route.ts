import { NextResponse } from "next/server";
import { getOrari, addOrario, updateOrario, deleteOrario } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";
import { requireAdminSession } from "@/lib/auth/session";

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
    const body = await request.json();
    const orario = await addOrario(body);
    revalidatePublicContent("orari");
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
    const body = await request.json();
    const { giorno, ...data } = body;
    const updated = await updateOrario(giorno, { giorno, ...data });
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("orari");
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
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
