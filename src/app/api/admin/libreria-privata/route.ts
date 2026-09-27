import { NextResponse } from "next/server";
import { getFilePrivati, addFilePrivato, deleteFilePrivato } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";
import { requireAdminSession } from "@/lib/auth/session";
import { validateContent } from "@/lib/admin/content-validation";
import type { FilePrivato } from "@/lib/data/store";

export async function GET() {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return NextResponse.json(await getFilePrivati());
}

export async function POST(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const parsed = validateContent("libreria-privata", await request.json(), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    // Data di caricamento decisa dal server, non dal client.
    const data = parsed.data as Partial<FilePrivato> & Pick<FilePrivato, "nome" | "url">;
    const file = await addFilePrivato({
      ...data,
      descrizione: data.descrizione ?? "",
      tipo: data.tipo ?? "Altro",
      dataCaricamento: new Date().toISOString(),
    });
    revalidatePublicContent("libreria");
    return NextResponse.json(file, { status: 201 });
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
    const deleted = await deleteFilePrivato(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("libreria");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
