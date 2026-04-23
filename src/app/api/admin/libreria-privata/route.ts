import { NextResponse } from "next/server";
import { getFilePrivati, addFilePrivato, deleteFilePrivato } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";

export async function GET() {
  return NextResponse.json(await getFilePrivati());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const file = await addFilePrivato(body);
    revalidatePublicContent("libreria");
    return NextResponse.json(file, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
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
