import { NextResponse } from "next/server";
import { getVideoCorsi, addVideoCorso, updateVideoCorso, deleteVideoCorso } from "@/lib/mongo/content";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";

export async function GET() {
  return NextResponse.json(await getVideoCorsi());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const videoCorso = await addVideoCorso(body);
    revalidatePublicContent("video-corsi");
    return NextResponse.json(videoCorso, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const updated = await updateVideoCorso(id, data);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("video-corsi");
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
    const deleted = await deleteVideoCorso(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("video-corsi");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}