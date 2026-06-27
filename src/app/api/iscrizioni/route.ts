import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById } from "@/lib/mongo/users";
import { getIscrizioniByUser } from "@/lib/mongo/registrations";
import { getEventoById } from "@/lib/mongo/content";
import type { IscrizioneEvento } from "@/types";

/**
 * GET /api/iscrizioni
 * Ritorna le iscrizioni agli eventi dell'utente corrente (user_session).
 * Solo per utenti normali loggati. Gli admin non hanno iscrizioni personali.
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

    const session = await validateUserSession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sessione non valida" },
        { status: 401 }
      );
    }

    const user = await findUserById(session.userId);
    if (!user || !user.attivo) {
      return NextResponse.json(
        { success: false, error: "Utente non trovato" },
        { status: 401 }
      );
    }

    // Recupera le iscrizioni dell'utente (per nome + cognome + email)
    const iscrizioni = await getIscrizioniByUser(user.nome, user.cognome, user.email);

    // Arricchisce ogni iscrizione con il titolo e la data dell'evento
    const iscrizioniArricchite = await Promise.all(
      iscrizioni.map(async (isc: IscrizioneEvento) => {
        const evento = await getEventoById(isc.eventoId).catch(() => null);
        return {
          ...isc,
          eventoTitolo: evento?.titolo ?? "Evento non trovato",
          eventoData: evento?.data ?? null,
          eventoLuogo: evento?.luogo ?? null,
          eventoReferente: evento?.referente ?? null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      iscrizioni: iscrizioniArricchite,
    });
  } catch (err) {
    console.error("Errore GET /api/iscrizioni:", err);
    return NextResponse.json(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
