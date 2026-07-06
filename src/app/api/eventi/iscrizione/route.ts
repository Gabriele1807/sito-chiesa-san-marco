import { NextRequest, NextResponse } from "next/server";
import { createIscrizione } from "@/lib/db";
import type { CreateIscrizioneData } from "@/types";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById, findUserByUsername } from "@/lib/mongo/users";
import { validateSession } from "@/lib/auth/session";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isIpRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests, please try again later.", errorCode: "rate_limit" },
        { status: 429 }
      );
    }
    recordIpRequest(ip);

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

    // === Estrai l'utente autenticato per tracciare chi ha creato l'iscrizione ===
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const adminToken = cookieStore.get("admin_session")?.value;

    let createdByNome = "";
    let createdByCognome = "";
    let createdByEmail: string | undefined = undefined;

    if (adminToken) {
      const adminUser = await validateSession(adminToken);
      if (adminUser) {
        createdByNome = adminUser.nome;
        createdByCognome = adminUser.cognome;
        const relatedUser = await findUserByUsername(adminUser.username);
        if (relatedUser) {
          createdByEmail = relatedUser.email;
        }
      }
    }

    if (!createdByNome && token) {
      const session = await validateUserSession(token);
      if (session) {
        const user = await findUserById(session.userId);
        if (user) {
          createdByNome = user.nome;
          createdByCognome = user.cognome;
          createdByEmail = user.email;
        }
      }
    }

    // Se non autenticato, aggiungi comunque i dati se disponibili nel body (backward compatibility)
    if (!createdByNome && body.email) {
      // Per utenti non autenticati ma con email, usa l'email come tracciamento
      createdByEmail = body.email;
    }

    // Aggiungi i campi di tracciamento al body
    const bodyWithCreator = {
      ...body,
      createdByNome,
      createdByCognome,
      createdByEmail,
    };

    const result = await createIscrizione(bodyWithCreator as CreateIscrizioneData);

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
