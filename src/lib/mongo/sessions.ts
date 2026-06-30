/**
 * Sessioni utenti normali tramite JWT firmati.
 * Compatibile con i cookie esistenti `user_session`.
 */

import { signJwt, verifyJwt } from "@/lib/auth/jwt";

const revokedUserTokens = new Set<string>();

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
  if (!token || revokedUserTokens.has(token)) return null;
  const payload = await verifyJwt<{ sub: string; sessionType?: string }>(token);
  if (!payload || payload.sessionType !== "user" || !payload.sub) return null;

  return { userId: payload.sub };
}

// --------------- Delete ---------------

export async function deleteUserSession(token: string): Promise<void> {
  if (token) {
    revokedUserTokens.add(token);
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  void userId;
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

    // Importa dinamicamente per evitare circular dependencies
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
