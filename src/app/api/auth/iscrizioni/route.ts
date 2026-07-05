import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById, findUserByUsername } from "@/lib/mongo/users";
import { getIscrizioniByUser } from "@/lib/mongo/registrations";
import { getEventoById } from "@/lib/mongo/content";
import { validateSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const adminToken = cookieStore.get("admin_session")?.value;

    let targetNome = "";
    let targetCognome = "";
    let targetEmail: string | undefined = undefined;

    if (adminToken) {
      const adminUser = await validateSession(adminToken);
      if (adminUser) {
        targetNome = adminUser.nome;
        targetCognome = adminUser.cognome;
        // Provo a recuperare l'email dall'utente MongoDB corrispondente (se esiste)
        const relatedUser = await findUserByUsername(adminUser.username);
        if (relatedUser) {
          targetEmail = relatedUser.email;
        }
      }
    } 
    
    if (!targetNome && token) {
      const session = await validateUserSession(token);
      if (session) {
        const user = await findUserById(session.userId);
        if (user) {
          targetNome = user.nome;
          targetCognome = user.cognome;
          targetEmail = user.email;
        }
      }
    }

    if (!targetNome) {
      return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
    }

    // Debug logging
    console.log("🔍 Ricerca iscrizioni per:", { targetNome, targetCognome, targetEmail });

    // Recupera iscrizioni dell'utente (o admin)
    const iscrizioniRaw = await getIscrizioniByUser(targetNome, targetCognome, targetEmail);

    console.log("📝 Iscrizioni trovate:", iscrizioniRaw.length);

    // Arricchisci i dati con informazioni sull'evento (titolo, data, etc.)
    const iscrizioniArr = [];
    for (const iscrizione of iscrizioniRaw) {
      const evento = await getEventoById(iscrizione.eventoId);
      if (evento) {
        iscrizioniArr.push({
          ...iscrizione,
          eventoTitolo: evento.titolo,
          eventoData: evento.data,
          eventoLuogo: evento.luogo,
          eventoReferente: evento.referente ?? null,
        });
      } else {
        // Evento potrebbe essere stato cancellato
        iscrizioniArr.push({
          ...iscrizione,
          eventoTitolo: "Evento non più disponibile",
          eventoData: "",
          eventoLuogo: "",
          eventoReferente: null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      iscrizioni: iscrizioniArr,
    });
  } catch (err) {
    console.error("Errore GET /api/auth/iscrizioni:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
