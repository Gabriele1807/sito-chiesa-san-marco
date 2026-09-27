/**
 * Configurazione delle notifiche push (Web Push con chiavi VAPID).
 *
 * Variabili d'ambiente (generare la coppia con `npm run generate-vapid-keys`):
 *  - NEXT_PUBLIC_VAPID_PUBLIC_KEY  chiave pubblica, usata anche dal browser
 *  - VAPID_PRIVATE_KEY             chiave privata, solo server
 *  - VAPID_SUBJECT                 contatto per i servizi push, es. "mailto:info@esempio.it"
 *
 * Senza tutte e tre le notifiche sono disattivate: il pulsante nel sito
 * non compare e l'invio dal pannello admin restituisce un errore esplicito.
 */

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  if (!/^(mailto:|https:\/\/)/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}
