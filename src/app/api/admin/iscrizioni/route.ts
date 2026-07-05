import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import { getEventi, getEventoById } from "@/lib/mongo/content";
import {
  getIscrizioniByEvento,
  countIscrizioniPerEvento,
  deleteIscrizione,
  updateIscrizione,
  updateIscrizionePagamento,
} from "@/lib/mongo/registrations";
import { requireAdminSession } from "@/lib/auth/session";

function countIscrittiInRegistrations(iscrizioni: Array<{ familyMembers?: Array<unknown> }>): number {
  return iscrizioni.reduce((total, iscrizione: any) => {
    if (iscrizione.registrationType === "family") {
      return total + (Array.isArray(iscrizione.familyMembers) ? iscrizione.familyMembers.length : 0);
    }
    return total + 1;
  }, 0);
}

/**
 * GET /api/admin/iscrizioni
 *  - senza query: ritorna la lista eventi + conteggio iscrizioni per ciascuno
 *  - ?eventoId=XXX: ritorna l'evento, i suoi iscritti e info posti
 */
export async function GET(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser || !hasPermission(adminUser.ruolo, "iscrizioni.read")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const eventoId = url.searchParams.get("eventoId");

    if (!eventoId) {
      // Riepilogo: tutti gli eventi con il numero di iscritti
      const [eventi, counts] = await Promise.all([getEventi(), countIscrizioniPerEvento()]);
      const riepilogo = eventi.map((ev) => ({
        id: ev.id,
        titolo: ev.titolo,
        data: ev.data,
        luogo: ev.luogo,
        referente: ev.referente,
        postiDisponibili: ev.postiDisponibili,
        showRaccoglimento: ev.showRaccoglimento,
        iscritti: counts[ev.id] ?? 0,
      }));
      return NextResponse.json({ success: true, eventi: riepilogo });
    }

    const evento = await getEventoById(eventoId);
    if (!evento) {
      return NextResponse.json({ success: false, error: "Evento non trovato" }, { status: 404 });
    }

    const iscrizioni = await getIscrizioniByEvento(eventoId);
    const iscrittiTotali = countIscrittiInRegistrations(iscrizioni);
    const summary = {
      totali: iscrittiTotali,
      pagati: iscrizioni.filter((iscrizione) => iscrizione.ha_pagato).length,
      nonPagati: iscrizioni.filter((iscrizione) => !iscrizione.ha_pagato).length,
    };
    const postiTotali =
      typeof evento.postiDisponibili === "number" && evento.postiDisponibili > 0
        ? evento.postiDisponibili
        : null;
    const postiRimasti = postiTotali !== null ? Math.max(0, postiTotali - iscrittiTotali) : null;

    return NextResponse.json({
      success: true,
      evento: {
        id: evento.id,
        titolo: evento.titolo,
        data: evento.data,
        luogo: evento.luogo,
        referente: evento.referente,
        postiDisponibili: evento.postiDisponibili,
        showRaccoglimento: evento.showRaccoglimento,
      },
      iscrizioni,
      summary,
      totali: iscrittiTotali,
      postiRimasti,
    });
  } catch (err) {
    console.error("Errore GET iscrizioni:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/iscrizioni?id=XXX — Elimina una singola iscrizione
 */
export async function DELETE(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser || !hasPermission(adminUser.ruolo, "iscrizioni.write")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID mancante" }, { status: 400 });
    }
    const deleted = await deleteIscrizione(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Iscrizione non trovata" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore DELETE iscrizione:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/iscrizioni?id=XXX — Aggiorna dati iscrizione
 */
export async function PATCH(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser || !hasPermission(adminUser.ruolo, "iscrizioni.write")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID mancante" }, { status: 400 });
    }

    const body = await request.json();
    const definedKeys = Object.entries(body).filter(([, value]) => value !== undefined);

    if (definedKeys.length === 1 && definedKeys[0]?.[0] === "ha_pagato") {
      if (typeof body.ha_pagato !== "boolean") {
        return NextResponse.json({ success: false, error: "Valore ha_pagato non valido" }, { status: 400 });
      }

      const updatedPagamento = await updateIscrizionePagamento(id, body.ha_pagato);
      if (!updatedPagamento) {
        return NextResponse.json({ success: false, error: "Iscrizione non trovata" }, { status: 404 });
      }

      return NextResponse.json({ success: true, ha_pagato: body.ha_pagato });
    }

    // Campi permessi per l'update (escludiamo quelli strutturali)
    const { nome, cognome, padreNome, padreCognome, telefono, email, note, ha_pagato } = body;

    if (ha_pagato !== undefined && typeof ha_pagato !== "boolean") {
      return NextResponse.json({ success: false, error: "Valore ha_pagato non valido" }, { status: 400 });
    }

    const updated = await updateIscrizione(id, {
      nome,
      cognome,
      padreNome,
      padreCognome,
      telefono,
      email,
      note,
      ha_pagato,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Iscrizione non trovata" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore PATCH iscrizione:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
