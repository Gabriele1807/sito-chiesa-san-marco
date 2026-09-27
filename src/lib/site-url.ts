/**
 * URL base assoluto del sito, da `NEXT_PUBLIC_SITE_URL`, senza slash finale.
 * Usato dove un URL deve uscire dal sito (link nelle email, redirect_uri
 * OAuth registrate sui portali provider): uno slash finale produrrebbe
 * `https://x.it//percorso`, che il provider rifiuta come redirect_uri diversa.
 * Ritorna `null` se la variabile manca o non è un URL http(s) valido: mai
 * derivato dall'header Host della richiesta (manipolabile dal client).
 */
export function getSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return raw.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
