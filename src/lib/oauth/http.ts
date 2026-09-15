import type { NextResponse } from "next/server";

/**
 * Applica `Cache-Control: no-store` a una risposta delle route OAuth.
 *
 * `vercel.json` imposta già questo header per tutte le route `/api/*` in
 * produzione, ma non si applica in `next dev`, e non protegge comunque dalla
 * bfcache del browser (un meccanismo distinto dalla cache HTTP). Impostarlo
 * anche qui, esplicitamente nel codice, garantisce che tornare indietro con
 * il browser su un URL di questo flusso (che usa sempre `state`/`code`
 * monouso) forzi sempre una richiesta fresca al server — mai una risposta
 * rigiocata dalla cache — sia in sviluppo che in produzione.
 */
export function applyNoStore<T extends NextResponse>(response: T): T {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
