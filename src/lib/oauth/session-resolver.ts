/**
 * Risolve la sessione corrente (utente normale o admin) dai cookie della
 * richiesta, provando prima `admin_session` poi `user_session` — stesso
 * ordine di priorità usato in `/api/auth/login`. Usato dalle route OAuth
 * che devono funzionare sia per utenti normali (MongoDB) sia per admin
 * (Supabase), es. `unlink` e `status`.
 */

export interface ResolvedAccountSession {
  accountType: "user" | "admin";
  id: string;
}

function readCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function resolveAccountSession(request: Request): Promise<ResolvedAccountSession | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const adminToken = readCookie(cookieHeader, "admin_session");
  if (adminToken) {
    const { validateSession } = await import("@/lib/auth/session");
    const admin = await validateSession(adminToken);
    if (admin && admin.attivo) return { accountType: "admin", id: admin.id };
  }

  const userToken = readCookie(cookieHeader, "user_session");
  if (userToken) {
    const { validateUserSession } = await import("@/lib/mongo/sessions");
    const session = await validateUserSession(userToken);
    if (session) return { accountType: "user", id: session.userId };
  }

  return null;
}
