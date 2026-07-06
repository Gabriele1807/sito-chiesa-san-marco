import { NextRequest, NextResponse } from "next/server";
import { createIscrizione } from "@/lib/db";
import { withDbRetry, getErrorMessage, isConnectionError } from "@/lib/mongo/operation-retry";
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

    // Validation: required fields
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

    // Validate email format if provided
    if (body.email && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "Email non valida", errorCode: "validation" },
          { status: 400 }
        );
      }
    }

    // === Extract authenticated user for tracking ===
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const adminToken = cookieStore.get("admin_session")?.value;

    let createdByNome = "";
    let createdByCognome = "";
    let createdByEmail: string | undefined = undefined;

    // Fetch authenticated user info with retry for cold start resilience
    try {
      if (adminToken) {
        const adminUser = await withDbRetry(
          () => validateSession(adminToken),
          { maxAttempts: 2 }
        );
        if (adminUser) {
          createdByNome = adminUser.nome;
          createdByCognome = adminUser.cognome;
          const relatedUser = await withDbRetry(
            () => findUserByUsername(adminUser.username),
            { maxAttempts: 2 }
          );
          if (relatedUser) {
            createdByEmail = relatedUser.email;
          }
        }
      }

      if (!createdByNome && token) {
        const session = await withDbRetry(
          () => validateUserSession(token),
          { maxAttempts: 2 }
        );
        if (session) {
          const user = await withDbRetry(
            () => findUserById(session.userId),
            { maxAttempts: 2 }
          );
          if (user) {
            createdByNome = user.nome;
            createdByCognome = user.cognome;
            createdByEmail = user.email;
          }
        }
      }
    } catch (dbErr) {
      console.error("[Iscrizione API] Database lookup error:", dbErr);
      // Continue without user tracking if auth lookup fails
      // This is non-critical for registration itself
    }

    // Se non autenticato, aggiungi comunque i dati se disponibili nel body (backward compatibility)
    if (!createdByNome && body.email) {
      createdByEmail = body.email;
    }

    // Add creator tracking to body
    const bodyWithCreator = {
      ...body,
      createdByNome,
      createdByCognome,
      createdByEmail,
    };

    // Create registration with retry logic for database resilience
    let result;
    try {
      result = await withDbRetry(
        () => createIscrizione(bodyWithCreator as CreateIscrizioneData),
        { maxAttempts: 3 }
      );
    } catch (dbErr) {
      console.error("[Iscrizione API] Registration error:", dbErr);
      if (isConnectionError(dbErr)) {
        return NextResponse.json(
          {
            error: "Registrazione non disponibile temporaneamente. Riprova tra pochi secondi.",
            errorCode: "db_unavailable",
            retryable: true,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: getErrorMessage(dbErr), errorCode: "server" },
        { status: 500 }
      );
    }

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
