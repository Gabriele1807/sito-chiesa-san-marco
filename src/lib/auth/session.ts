/**
 * Gestione sessioni admin tramite JWT firmati.
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";

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
 * Crea un JWT di sessione admin e ritorna il token.
 */
export async function createSession(
  adminUserId: string,
  _req: Request,
  rememberMe = false
): Promise<{ token: string; expiresAt: Date }> {
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + duration);
  const adminUser = await getAdminUserById(adminUserId);
  if (!adminUser) {
    throw new Error("Amministratore non trovato");
  }

  const token = await signJwt(
    {
      sub: adminUser.id,
      sessionType: "admin",
      username: adminUser.username,
      email: adminUser.email,
      nome: adminUser.nome,
      cognome: adminUser.cognome,
      ruolo: adminUser.ruolo,
      attivo: adminUser.attivo,
      ultimo_accesso: adminUser.ultimo_accesso ?? "",
    },
    Math.floor(duration / 1000)
  );

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

  const payload = await verifyJwt<{
    sub: string;
    sessionType?: string;
    username?: string;
    email?: string;
    nome?: string;
    cognome?: string;
    ruolo?: "superadmin" | "admin";
    attivo?: boolean;
    ultimo_accesso?: string;
  }>(token);

  if (!payload || payload.sessionType !== "admin" || !payload.sub || !payload.username || !payload.ruolo) {
    return null;
  }

  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email ?? "",
    nome: payload.nome ?? "",
    cognome: payload.cognome ?? "",
    ruolo: payload.ruolo,
    attivo: payload.attivo ?? true,
    ultimo_accesso: payload.ultimo_accesso ?? null,
  };
}

/**
 * Elimina una sessione dal DB (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  void token;
}

/**
 * Rimuove tutte le sessioni scadute dal DB.
 * Da chiamare ad ogni login per mantenere pulita la tabella.
 */
export async function cleanExpiredSessions(): Promise<void> {
  return Promise.resolve();
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, email, nome, cognome, ruolo, attivo, ultimo_accesso")
    .eq("id", id)
    .eq("attivo", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    nome: data.nome,
    cognome: data.cognome,
    ruolo: data.ruolo,
    attivo: data.attivo,
    ultimo_accesso: data.ultimo_accesso,
  };
}
