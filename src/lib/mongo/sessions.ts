/**
 * Sessioni utenti normali tramite JWT firmati.
 * Compatibile con i cookie esistenti `user_session`.
 *
 * Nota architetturale (vedi design spec §3,
 * docs/superpowers/specs/2026-09-15-password-reset-email-service-design.md):
 * JWT firmato. Due meccanismi di invalidazione:
 * - logout di una singola sessione: deny-list per-token su MongoDB
 *   (src/lib/mongo/revoked-sessions.ts), perché al logout il token è noto;
 * - cambio/reset password: `passwordChangedAt` su UserProfile confrontato con
 *   `iat` del token, perché i token delle ALTRE sessioni attive non sono noti.
 * admin_session usa invece Redis (src/lib/auth/session.ts).
 */

import { signJwt, verifyJwt } from "@/lib/auth/jwt";
import { isUserSessionTokenRevoked, revokeUserSessionToken } from "./revoked-sessions";

// Durate sessione
const SESSION_DURATION_DEFAULT = 24 * 60 * 60 * 1000; // 24 ore
const SESSION_DURATION_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 giorni

// --------------- Create ---------------

export async function createUserSession(
  userId: string,
  _req: Request,
  rememberMe = false,
  options?: { passwordChangedAt?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + duration);
  const token = await signJwt(
    {
      sub: userId,
      sessionType: "user",
      // `pca` = passwordChangedAt noto al momento dell'emissione. Serve solo
      // alla sessione riemessa subito dopo un cambio password: il suo `iat`
      // (in secondi) può coincidere con il secondo di passwordChangedAt e
      // verrebbe altrimenti rifiutato insieme alle sessioni da invalidare.
      ...(options?.passwordChangedAt ? { pca: options.passwordChangedAt } : {}),
    },
    Math.floor(duration / 1000)
  );

  return { token, expiresAt };
}

// --------------- Validate ---------------

export async function validateUserSession(
  token: string
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const payload = await verifyJwt<{ sub: string; sessionType?: string; pca?: string }>(token);
  if (!payload || payload.sessionType !== "user" || !payload.sub) return null;
  if (await isUserSessionTokenRevoked(token)) return null;

  // Importa dinamicamente per evitare circular dependencies (stesso pattern
  // già usato in getUserFromSessionToken più sotto).
  const { findUserByIdFull } = await import("./users");
  const user = await findUserByIdFull(payload.sub);
  if (!user) return null;

  if (user.passwordChangedAt && payload.pca !== user.passwordChangedAt) {
    const changedAtSeconds = Math.floor(Date.parse(user.passwordChangedAt) / 1000);
    if (payload.iat <= changedAtSeconds) return null;
  }

  return { userId: payload.sub };
}

// --------------- Delete ---------------

/**
 * Logout di una singola sessione: revoca il JWT lato server (deny-list su
 * MongoDB fino alla sua scadenza naturale), così una copia del token non è
 * più utilizzabile dopo il logout. Token non validi o già scaduti non
 * vengono registrati.
 */
export async function deleteUserSession(token: string): Promise<void> {
  if (!token) return;
  const payload = await verifyJwt<{ sub: string; sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "user" || !payload.sub) return;
  await revokeUserSessionToken(token, payload.exp, payload.sub);
}

/**
 * Logout da tutti i dispositivi: invalida retroattivamente OGNI sessione
 * esistente per l'utente impostando passwordChangedAt = ora, cosicché
 * qualunque JWT con iat <= ora venga rifiutato da validateUserSession.
 * Usata da reset-password e change-password dopo un cambio password riuscito.
 * Ritorna il nuovo passwordChangedAt, da passare a createUserSession quando
 * la sessione corrente va mantenuta (change-password).
 */
export async function deleteAllUserSessions(userId: string): Promise<string> {
  const { setPasswordChangedAt } = await import("./users");
  return setPasswordChangedAt(userId);
}

// --------------- Cleanup ---------------

export async function cleanExpiredUserSessions(): Promise<void> {
  return Promise.resolve();
}

// --------------- Helper for server-side access checks ---------------

/**
 * Recupera l'utente associato a una sessione, se valida.
 * Usato per verificare il ruolo dell'utente nelle route server-side.
 */
export async function getUserFromSessionToken(
  sessionToken: string
): Promise<{ userId: string; role: string } | null> {
  if (!sessionToken) return null;

  try {
    const session = await validateUserSession(sessionToken);
    if (!session) return null;

    const { findUserById } = await import("./users");
    const user = await findUserById(session.userId);

    if (!user) return null;

    return {
      userId: session.userId,
      role: user.role,
    };
  } catch (error) {
    console.error("[getUserFromSessionToken] Errore:", error);
    return null;
  }
}
