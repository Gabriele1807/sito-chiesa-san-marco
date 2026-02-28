import { NextResponse } from "next/server";
import { getOrari, addOrario, updateOrario, deleteOrario } from "@/lib/data/store";

export async function GET() {
  return NextResponse.json(getOrari());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orario = addOrario(body);
    return NextResponse.json(orario, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { giorno, ...data } = body;
    const updated = updateOrario(giorno, { giorno, ...data });
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const giorno = searchParams.get("giorno");
    if (!giorno) return NextResponse.json({ error: "Giorno mancante" }, { status: 400 });
    const deleted = deleteOrario(giorno);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
