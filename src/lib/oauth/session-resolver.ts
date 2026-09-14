/**
 * Risolve la sessione corrente (utente normale o admin) dai cookie della
 * richiesta. Punto unico per validare i token di sessione utente/admin nel
 * contesto OAuth — usato da `unlink`, `status`, `start` e `callback` così
 * che i due tipi di sessione siano sempre validati allo stesso modo ovunque
 * (prima di questo refactor, `callback/route.ts` duplicava la propria copia
 * di questa logica, col rischio che le due copie divergessero nel tempo).
 */

export type OAuthSessionAccountType = "user" | "admin";

export interface ResolvedAccountSession {
  accountType: OAuthSessionAccountType;
  id: string;
}

export function readSessionCookie(request: Request, accountType: OAuthSessionAccountType): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const name = accountType === "admin" ? "admin_session" : "user_session";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Valida un token di sessione admin. Ritorna null se assente/scaduto/disattivato. */
export async function resolveAdminSessionToken(token: string): Promise<{ id: string } | null> {
  const { validateSession } = await import("@/lib/auth/session");
  const admin = await validateSession(token);
  if (!admin || !admin.attivo) return null;
  return { id: admin.id };
}

/** Valida un token di sessione utente normale. Ritorna null se assente/scaduto. */
export async function resolveUserSessionToken(token: string): Promise<{ id: string } | null> {
  const { validateUserSession } = await import("@/lib/mongo/sessions");
  const session = await validateUserSession(token);
  return session ? { id: session.userId } : null;
}

/**
 * Prova prima `admin_session`, poi `user_session` (stesso ordine usato in
 * `/api/auth/login`). Usato dove il chiamante non sa già quale tipo di
 * sessione aspettarsi (es. `unlink`, `status`).
 */
export async function resolveAccountSession(request: Request): Promise<ResolvedAccountSession | null> {
  const adminToken = readSessionCookie(request, "admin");
  if (adminToken) {
    const admin = await resolveAdminSessionToken(adminToken);
    if (admin) return { accountType: "admin", id: admin.id };
  }

  const userToken = readSessionCookie(request, "user");
  if (userToken) {
    const user = await resolveUserSessionToken(userToken);
    if (user) return { accountType: "user", id: user.id };
  }

  return null;
}
