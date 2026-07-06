import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById } from "@/lib/mongo/users";
import { getIscrizioniByUser } from "@/lib/mongo/registrations";
import { getEventoById } from "@/lib/mongo/content";
import { withDbRetry, getErrorMessage, isConnectionError } from "@/lib/mongo/operation-retry";
import type { IscrizioneEvento, UserPublic } from "@/types";

/**
 * GET /api/iscrizioni
 * Ritorna le iscrizioni agli eventi dell'utente corrente (user_session).
 * Solo per utenti normali loggati. Gli admin non hanno iscrizioni personali.
 * Includes retry logic for MongoDB cold start resilience.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Non autenticato" },
        { status: 401 }
      );
    }

    // Validate session with retry
    let session;
    try {
      session = await withDbRetry(() => validateUserSession(token), { maxAttempts: 2 });
    } catch (err) {
      if (isConnectionError(err)) {
        return NextResponse.json(
          { success: false, error: "Database connection issue, please try again", retryable: true },
          { status: 503 }
        );
      }
      throw err;
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sessione non valida" },
        { status: 401 }
      );
    }

    // Fetch user and registrations with retry
    let user: UserPublic | null = null;
    let iscrizioni: IscrizioneEvento[] = [];
    try {
      user = await withDbRetry(() => findUserById(session.userId), { maxAttempts: 2 });
      iscrizioni = await withDbRetry(
        () => getIscrizioniByUser(user?.nome ?? "", user?.cognome ?? "", user?.email),
        { maxAttempts: 2 }
      ).catch(() => []);
    } catch (dbErr) {
      console.error("[Iscrizioni API] Database error:", dbErr);
      if (isConnectionError(dbErr)) {
        return NextResponse.json(
          { success: false, error: "Database unavailable, please try again", retryable: true },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: getErrorMessage(dbErr) },
        { status: 500 }
      );
    }

    if (!user || !user.attivo) {
      return NextResponse.json(
        { success: false, error: "Utente non trovato" },
        { status: 401 }
      );
    }

    // Enrich registrations with event details (with retry for each event)
    const iscrizioniArricchite = await Promise.all(
      iscrizioni.map(async (isc: IscrizioneEvento) => {
        try {
          const evento = await withDbRetry(
            () => getEventoById(isc.eventoId),
            { maxAttempts: 2 }
          ).catch(() => null);

          return {
            ...isc,
            eventoTitolo: evento?.titolo ?? "Evento non trovato",
            eventoData: evento?.data ?? null,
            eventoLuogo: evento?.luogo ?? null,
            eventoReferente: evento?.referente ?? null,
          };
        } catch {
          return {
            ...isc,
            eventoTitolo: "Evento non trovato",
            eventoData: null,
            eventoLuogo: null,
            eventoReferente: null,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      iscrizioni: iscrizioniArricchite,
    });
  } catch (err) {
    console.error("[Iscrizioni API] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
