/**
 * Gestione sessioni admin con Supabase.
 *
 * Le sessioni vengono salvate nella tabella admin_sessions.
 * Il token viene generato con crypto.randomUUID() e impostato
 * come cookie httpOnly.
 */

import { supabaseAdmin } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: "superadmin" | "admin";
  attivo: boolean;
  ultimo_accesso: string | null;
}

// Durate sessione
const SESSION_DURATION_DEFAULT = 24 * 60 * 60 * 1000; // 24 ore
const SESSION_DURATION_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 giorni

/**
 * Crea una nuova sessione nel DB e ritorna il token.
 */
export async function createSession(
  adminUserId: string,
  req: Request,
  rememberMe = false
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomUUID();
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + duration);

  // Estrai IP e User-Agent dalla request
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const { error } = await supabaseAdmin.from("admin_sessions").insert({
    admin_user_id: adminUserId,
    session_token: token,
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    throw new Error(`Errore creazione sessione: ${error.message}`);
  }

  return { token, expiresAt };
}

/**
 * Valida un token di sessione.
 * Ritorna i dati admin se la sessione è valida, null altrimenti.
 */
export async function validateSession(
  token: string
): Promise<AdminUser | null> {
  if (!token) return null;

  const { data, error } = await supabaseAdmin
    .from("admin_sessions")
    .select(
      `
      id,
      expires_at,
      admin_user_id,
      admin_users (
        id,
        username,
        email,
        nome,
        cognome,
        ruolo,
        attivo,
        ultimo_accesso
      )
    `
    )
    .eq("session_token", token)
    .single();

  if (error || !data) return null;

  // Sessione scaduta
  if (new Date(data.expires_at) < new Date()) {
    // Pulizia: rimuovi la sessione scaduta
    await supabaseAdmin
      .from("admin_sessions")
      .delete()
      .eq("session_token", token);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = data.admin_users as any;
  if (!user || !user.attivo) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nome: user.nome,
    cognome: user.cognome,
    ruolo: user.ruolo,
    attivo: user.attivo,
    ultimo_accesso: user.ultimo_accesso,
  };
}

/**
 * Elimina una sessione dal DB (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  await supabaseAdmin
    .from("admin_sessions")
    .delete()
    .eq("session_token", token);
}

/**
 * Rimuove tutte le sessioni scadute dal DB.
 * Da chiamare ad ogni login per mantenere pulita la tabella.
 */
export async function cleanExpiredSessions(): Promise<void> {
  await supabaseAdmin
    .from("admin_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
