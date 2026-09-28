import { NextRequest, NextResponse, after } from "next/server";
import { createIscrizione, getEventoById } from "@/lib/db";
import { sendRegistrationConfirmation } from "@/lib/events/registration-emails";
import { withDbRetry, getErrorMessage, isConnectionError } from "@/lib/mongo/operation-retry";
import type { CreateIscrizioneData } from "@/types";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById, findUserByUsername } from "@/lib/mongo/users";
import { validateSession } from "@/lib/auth/session";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";
import { consumeActionLimit, LIMITS } from "@/lib/auth/action-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (await isIpRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests, please try again later.", errorCode: "rate_limit" },
        { status: 429 }
      );
    }
    await recordIpRequest(ip);

    const body = (await request.json()) as Partial<CreateIscrizioneData>;
    const isFamily = body.registrationType === "family";

    // Validation: required fields
    if (!body.eventoId || !body.telefono?.trim()) {
      return NextResponse.json(
        {
          error: "Campi obbligatori mancanti: telefono ed evento",
          errorCode: "validation",
        },
        { status: 400 }
      );
    }

    if (!isFamily) {
      if (
        !body.nome?.trim() ||
        !body.cognome?.trim() ||
        !body.padreNome?.trim() ||
        !body.padreCognome?.trim()
      ) {
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
    // Proprietà dell'iscrizione: solo dalla sessione, mai dal body.
    let createdByUserId: string | undefined = undefined;
    let createdByAccountType: "user" | "admin" | undefined = undefined;

    // Fetch authenticated user info with retry for cold start resilience
    try {
      if (adminToken) {
        const adminUser = await withDbRetry(() => validateSession(adminToken), { maxAttempts: 2 });
        if (adminUser) {
          createdByNome = adminUser.nome;
          createdByCognome = adminUser.cognome;
          createdByUserId = adminUser.id;
          createdByAccountType = "admin";
          const relatedUser = await withDbRetry(() => findUserByUsername(adminUser.username), {
            maxAttempts: 2,
          });
          if (relatedUser) {
            createdByEmail = relatedUser.email;
          }
        }
      }

      if (!createdByNome && token) {
        const session = await withDbRetry(() => validateUserSession(token), { maxAttempts: 2 });
        if (session) {
          const user = await withDbRetry(() => findUserById(session.userId), { maxAttempts: 2 });
          if (user) {
            createdByNome = user.nome;
            createdByCognome = user.cognome;
            createdByEmail = user.email;
            createdByUserId = session.userId;
            createdByAccountType = "user";
          }
        }
      }
    } catch (dbErr) {
      console.error("[Iscrizione API] Database lookup error:", dbErr);
      return NextResponse.json(
        {
          error: "Registrazione non disponibile temporaneamente. Riprova tra pochi secondi.",
          errorCode: "db_unavailable",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // L'iscrizione richiede un account: la pagina lo chiede già, ma l'API
    // va protetta anche se chiamata direttamente. Così ogni email di
    // conferma/promemoria va solo all'indirizzo dell'account, mai a un
    // indirizzo arbitrario scritto nel modulo.
    if (!createdByUserId || !createdByAccountType) {
      return NextResponse.json(
        { error: "Accedi per iscriverti agli eventi.", errorCode: "unauthenticated" },
        { status: 401 }
      );
    }

    const accountLimit = await consumeActionLimit(
      LIMITS.eventRegistration,
      `${createdByAccountType}:${createdByUserId}`
    );
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests, please try again later.", errorCode: "rate_limit" },
        { status: 429 }
      );
    }

    // Nessun dato "createdBy*" preso dal body: sono usati per stabilire chi
    // vede i dati di contatto dell'iscrizione (redactForViewer), quindi devono
    // venire solo dalla sessione.
    const bodyWithCreator = {
      ...body,
      // Lingua delle email: quella con cui la persona sta usando il sito.
      emailLocale: cookieStore.get("locale")?.value === "ar" ? "ar" : "it",
      createdByNome,
      createdByCognome,
      createdByEmail,
      createdByUserId,
      createdByAccountType,
    };

    // Create registration with retry logic for database resilience
    let result;
    try {
      result = await withDbRetry(() => createIscrizione(bodyWithCreator as CreateIscrizioneData), {
        maxAttempts: 3,
      });
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
              error: "Questa persona risulta già iscritta a questo evento con lo stesso genitore.",
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

    // Email di conferma dopo la risposta: l'utente non aspetta l'invio e un
    // problema del provider email non annulla un'iscrizione già salvata.
    const iscrizione = result.iscrizione;
    if (iscrizione) {
      after(async () => {
        try {
          const evento = await getEventoById(iscrizione.eventoId);
          if (!evento) return;
          const sent = await sendRegistrationConfirmation(evento, iscrizione);
          if (sent && !sent.ok)
            console.error("[Iscrizione API] conferma email non inviata", { error: sent.error });
        } catch (err) {
          console.error(
            "[Iscrizione API] errore invio conferma",
            err instanceof Error ? err.message : "unknown"
          );
        }
      });
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
