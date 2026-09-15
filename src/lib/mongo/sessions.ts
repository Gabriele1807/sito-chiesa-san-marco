/**
 * Sessioni utenti normali tramite JWT firmati.
 * Compatibile con i cookie esistenti `user_session`.
 *
 * Nota architetturale (vedi design spec §3,
 * docs/superpowers/specs/2026-09-15-password-reset-email-service-design.md):
 * questo è un JWT completamente stateless, senza alcun aggancio server-side
 * per-token. L'invalidazione dopo un cambio password è ottenuta tramite
 * `passwordChangedAt` su UserProfile confrontato con `iat` del token, non
 * tramite una deny-list (che richiederebbe conoscere il token esatto delle
 * altre sessioni attive, cosa che non abbiamo). Questo è un meccanismo
 * diverso da quello usato per admin_session (src/lib/auth/session.ts), e
 * intenzionalmente non unificato con esso.
 */

import { signJwt, verifyJwt } from "@/lib/auth/jwt";

// Durate sessione
const SESSION_DURATION_DEFAULT = 24 * 60 * 60 * 1000; // 24 ore
const SESSION_DURATION_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 giorni

// --------------- Create ---------------

export async function createUserSession(
  userId: string,
  _req: Request,
  rememberMe = false
): Promise<{ token: string; expiresAt: Date }> {
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + duration);
  const token = await signJwt(
    {
      sub: userId,
      sessionType: "user",
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
  const payload = await verifyJwt<{ sub: string; sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "user" || !payload.sub) return null;

  // Importa dinamicamente per evitare circular dependencies (stesso pattern
  // già usato in getUserFromSessionToken più sotto).
  const { findUserByIdFull } = await import("./users");
  const user = await findUserByIdFull(payload.sub);
  if (!user) return null;

  if (user.passwordChangedAt) {
    const changedAtSeconds = Math.floor(Date.parse(user.passwordChangedAt) / 1000);
    if (payload.iat <= changedAtSeconds) return null;
  }

  return { userId: payload.sub };
}

// --------------- Delete ---------------

/**
 * Logout di una singola sessione. NON esiste uno store per-token per
 * user_session (a differenza di admin_session): questa funzione pulisce
 * solo il cookie lato client chiamante. Il JWT resta valido lato server
 * fino alla scadenza naturale se qualcuno ne conserva una copia — limite
 * documentato, non una vera revoca. Vedi design spec §3 e PROJECT_CONTEXT.md.
 */
export async function deleteUserSession(token: string): Promise<void> {
  void token;
}

/**
 * Logout da tutti i dispositivi: invalida retroattivamente OGNI sessione
 * esistente per l'utente impostando passwordChangedAt = ora, cosicché
 * qualunque JWT con iat <= ora venga rifiutato da validateUserSession.
 * Usata da reset-password e change-password dopo un cambio password riuscito.
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const { setPasswordChangedAt } = await import("./users");
  await setPasswordChangedAt(userId);
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
