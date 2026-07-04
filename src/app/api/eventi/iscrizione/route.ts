import { NextRequest, NextResponse } from "next/server";
import { createIscrizione } from "@/lib/db";
import type { CreateIscrizioneData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateIscrizioneData>;
    const isFamily = body.registrationType === "family";

    // Campi obbligatori: telefono ed eventoId. Email opzionale.
    // Per le iscrizioni non-famiglia restano obbligatori partecipante e padre.
    if (
      !body.eventoId ||
      !body.telefono?.trim()
    ) {
      return NextResponse.json(
        {
          error: "Campi obbligatori mancanti: telefono ed evento",
          errorCode: "validation",
        },
        { status: 400 }
      );
    }

    if (!isFamily) {
      if (!body.nome?.trim() || !body.cognome?.trim() || !body.padreNome?.trim() || !body.padreCognome?.trim()) {
        return NextResponse.json(
          {
            error:
              "Campi obbligatori mancanti: nome, cognome, nome del padre, cognome del padre, telefono ed evento",
            errorCode: "validation",
          },
          { status: 400 }
        );
      }
    }

    // Email opzionale: se presente deve essere valida
    if (body.email && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "Email non valida", errorCode: "validation" },
          { status: 400 }
        );
      }
    }

    const result = await createIscrizione(body as CreateIscrizioneData);

    if (!result.success) {
      switch (result.errorCode) {
        case "duplicate":
          return NextResponse.json(
            {
              error:
                "Questa persona risulta già iscritta a questo evento con lo stesso genitore.",
              errorCode: "duplicate",
            },
            { status: 409 }
          );
        case "full":
          return NextResponse.json(
            { error: "Posti esauriti per questo evento.", errorCode: "full" },
            { status: 409 }
          );
        case "validation":
          return NextResponse.json(
            { error: "Dati non validi.", errorCode: "validation" },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: "Errore interno del server.", errorCode: "server" },
            { status: 500 }
          );
      }
    }

    return NextResponse.json(
      {
        message: "Iscrizione avvenuta con successo",
        sameFamily: result.sameFamily ?? false,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Errore interno del server", errorCode: "server" },
      { status: 500 }
    );
  }
}
