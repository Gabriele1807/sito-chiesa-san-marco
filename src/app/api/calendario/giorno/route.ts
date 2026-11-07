/**
 * API pubblica: GET /api/calendario/giorno?fixed=04-27&movable=E-105&seasonal=04-S4-0
 *
 * Restituisce SOLO i contenuti pubblicati delle tre chiavi richieste (mai
 * l'intero archivio). Se il database non risponde: 200 con
 * `available: false`, così la pagina mostra "Letture del giorno in arrivo".
 */

import { NextResponse } from "next/server";
import { getDayContentSafe, withTimeout, CALENDARIO_TIMEOUT_MS } from "@/lib/calendario-data";
import { CONTENT_LEVELS, isValidContentKey, type ContentKeys } from "@/lib/calendario/content";
import { getSectionAccess } from "@/lib/section-access";
import { CALENDARIO_SECTION_ID } from "@/lib/mongo/calendario";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const keys = {} as ContentKeys;
  for (const level of CONTENT_LEVELS) {
    const key = params.get(level);
    if (!isValidContentKey(level, key)) {
      return NextResponse.json({ error: `Chiave "${level}" non valida` }, { status: 400 });
    }
    keys[level] = key;
  }

  // Stessa visibilità della pagina /calendario (in caso di errore: accesso consentito).
  const access = await withTimeout(
    getSectionAccess(CALENDARIO_SECTION_ID),
    CALENDARIO_TIMEOUT_MS
  ).catch(() => "full" as const);
  if (access !== "full") {
    return NextResponse.json({ error: "Sezione non disponibile" }, { status: 403 });
  }

  const { data } = await getDayContentSafe(keys);
  return NextResponse.json(data, {
    // La risposta dipende dal ruolo (visibilità): cache solo nel browser.
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
