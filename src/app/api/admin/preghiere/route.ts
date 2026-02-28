import { NextResponse } from "next/server";
import { getPreghiere, addPreghiera, updatePreghiera, deletePreghiera } from "@/lib/data/store";

export async function GET() {
  return NextResponse.json(getPreghiere());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const preghiera = addPreghiera(body);
    return NextResponse.json(preghiera, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const updated = updatePreghiera(id, data);
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
    const deleted = deletePreghiera(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
