import { NextResponse } from "next/server";
import { getIcone, addIcona, updateIcona, deleteIcona } from "@/lib/supabase/content";

export async function GET() {
  return NextResponse.json(await getIcone());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const icona = await addIcona(body);
    return NextResponse.json(icona, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const updated = await updateIcona(id, data);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const deleted = await deleteIcona(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
