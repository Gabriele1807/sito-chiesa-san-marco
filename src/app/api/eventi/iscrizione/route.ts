import { NextRequest, NextResponse } from "next/server";
import { createIscrizione } from "@/lib/db";
import type { IscrizioneEvento } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: IscrizioneEvento = await request.json();

    // Validate required fields
    if (!body.nome || !body.email || !body.telefono || !body.eventoId) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti: nome, email, telefono, eventoId" },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Email non valida" },
        { status: 400 }
      );
    }

    // In production, this would save to Supabase
    const result = await createIscrizione(body);

    return NextResponse.json(
      { message: "Iscrizione avvenuta con successo", ...result },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
