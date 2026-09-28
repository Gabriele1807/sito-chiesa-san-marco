/**
 * Configurazione delle notifiche push (Web Push con chiavi VAPID).
 *
 * Variabili d'ambiente (generare la coppia con `npm run generate-vapid-keys`):
 *  - NEXT_PUBLIC_VAPID_PUBLIC_KEY  chiave pubblica, usata anche dal browser
 *  - VAPID_PRIVATE_KEY             chiave privata, solo server
 *  - VAPID_SUBJECT                 contatto per i servizi push, es. "mailto:info@esempio.it"
 *
 * Senza tutte e tre (valide e della stessa coppia) le notifiche sono
 * disattivate: il server rifiuta le iscrizioni e l'invio dal pannello admin
 * restituisce un errore esplicito. `checkVapidConfig` dice *cosa* non va,
 * senza mai riportare i valori, per il pannello admin.
 */

import { createECDH } from "node:crypto";

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface VapidCheck {
  config: VapidConfig | null;
  /** Problemi in italiano per il pannello admin; mai i valori delle variabili. */
  problems: string[];
}

const BASE64URL = /^[A-Za-z0-9_-]+$/;
// Errori tipici incollando su Vercel: virgolette, spazi, riga "NOME=valore" intera.
const PASTE_HINT = /^["'`]|["'`]$|\s|=/;

function decodeBase64Url(value: string): Buffer | null {
  if (!BASE64URL.test(value)) return null;
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function checkVapidConfig(env: NodeJS.ProcessEnv = process.env): VapidCheck {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = env.VAPID_SUBJECT?.trim() ?? "";
  const problems: string[] = [];

  const missing = [
    ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", publicKey],
    ["VAPID_PRIVATE_KEY", privateKey],
    ["VAPID_SUBJECT", subject],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    problems.push(
      `Variabili mancanti in questo deploy: ${missing.join(", ")}. Controlla che siano ` +
        `impostate per l'ambiente Production e fai un nuovo deploy.`
    );
  }

  if (subject && !/^(mailto:|https:\/\/)/.test(subject)) {
    problems.push(
      PASTE_HINT.test(subject)
        ? 'VAPID_SUBJECT contiene virgolette, spazi o "=": inserisci solo il valore, ad esempio mailto:info@tuodominio.it.'
        : 'VAPID_SUBJECT deve iniziare con "mailto:" (ad esempio mailto:info@tuodominio.it) oppure con "https://".'
    );
  }

  const publicBytes = publicKey ? decodeBase64Url(publicKey) : null;
  if (publicKey && (!publicBytes || publicBytes.length !== 65 || publicBytes[0] !== 4)) {
    problems.push(
      PASTE_HINT.test(publicKey)
        ? 'NEXT_PUBLIC_VAPID_PUBLIC_KEY contiene virgolette, spazi o "=": inserisci solo la chiave.'
        : "NEXT_PUBLIC_VAPID_PUBLIC_KEY non è una chiave pubblica VAPID valida (87 caratteri base64url)."
    );
  }

  const privateBytes = privateKey ? decodeBase64Url(privateKey) : null;
  if (privateKey && (!privateBytes || privateBytes.length !== 32)) {
    problems.push(
      PASTE_HINT.test(privateKey)
        ? 'VAPID_PRIVATE_KEY contiene virgolette, spazi o "=": inserisci solo la chiave.'
        : "VAPID_PRIVATE_KEY non è una chiave privata VAPID valida (43 caratteri base64url)."
    );
  }

  // Le due chiavi devono essere della stessa coppia: con chiavi di coppie
  // diverse i telefoni si iscrivono ma le notifiche vengono rifiutate.
  if (
    publicBytes?.length === 65 &&
    privateBytes?.length === 32 &&
    !problems.some(
      (p) => p.startsWith("NEXT_PUBLIC_VAPID_PUBLIC_KEY") || p.startsWith("VAPID_PRIVATE_KEY")
    )
  ) {
    try {
      const ecdh = createECDH("prime256v1");
      ecdh.setPrivateKey(privateBytes);
      if (!ecdh.getPublicKey().equals(publicBytes)) {
        problems.push(
          "NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY non sono della stessa coppia: " +
            "copia entrambe dalla stessa generazione (npm run generate-vapid-keys)."
        );
      }
    } catch {
      problems.push("VAPID_PRIVATE_KEY non è una chiave privata valida per le notifiche push.");
    }
  }

  return {
    config: problems.length ? null : { publicKey, privateKey, subject },
    problems,
  };
}

export function getVapidConfig(): VapidConfig | null {
  return checkVapidConfig().config;
}
