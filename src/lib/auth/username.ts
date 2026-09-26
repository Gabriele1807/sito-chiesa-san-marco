/**
 * Regole e unicità dei nomi utente, condivise da registrazione classica,
 * registrazione OAuth, modifica profilo (utente e admin) e creazione admin.
 *
 * Gli username vivono in due archivi: `users` (MongoDB) e `admin_users`
 * (Supabase). Un admin promosso da utente ha un record in entrambi con lo
 * STESSO username, ed è proprio lo username a collegarli (me, iscrizioni,
 * change-password, richieste-admin). Per questo l'unicità va verificata su
 * entrambi gli archivi e senza distinguere maiuscole/minuscole: "Mario" e
 * "mario" sarebbero indistinguibili per le persone e collegherebbero
 * account diversi.
 *
 * ⚠️ Solo lato server.
 */

import { supabaseAdmin } from "@/lib/supabase/server";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

export const USERNAME_INVALID_ERROR =
  "Username non valido (3–30 caratteri, solo lettere, numeri, . _ -)";
export const USERNAME_TAKEN_ERROR = "Username già in uso da un altro account";

/** Ritorna lo username ripulito dagli spazi esterni, o null se non valido. */
export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) return null;
  if (!USERNAME_PATTERN.test(value)) return null;
  return value;
}

/** Escape dei caratteri jolly di LIKE/ILIKE (`_` è ammesso negli username). */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export interface UsernameOwnerExclusions {
  /** _id MongoDB dell'account che sta rinominando/possiede già lo username. */
  userId?: string;
  /** id Supabase dell'admin che sta rinominando/possiede già lo username. */
  adminId?: string;
}

/**
 * true se lo username (senza distinzione maiuscole/minuscole) è già usato da
 * un account diverso da quelli esclusi, in `users` o in `admin_users`.
 */
export async function isUsernameTaken(
  username: string,
  exclude: UsernameOwnerExclusions = {}
): Promise<boolean> {
  const { findUsersByUsernameInsensitive } = await import("@/lib/mongo/users");
  const [mongoMatches, adminResult] = await Promise.all([
    findUsersByUsernameInsensitive(username),
    supabaseAdmin
      .from("admin_users")
      .select("id")
      .ilike("username", escapeLikePattern(username))
      .limit(5),
  ]);

  if (adminResult.error) {
    // Nel dubbio non si concede lo username: meglio un falso "già in uso"
    // che un duplicato tra i due archivi.
    console.error("[username] verifica admin_users fallita:", adminResult.error.message);
    return true;
  }

  if (mongoMatches.some((u) => u._id !== exclude.userId)) return true;
  const adminRows = (adminResult.data ?? []) as { id: string }[];
  return adminRows.some((a) => a.id !== exclude.adminId);
}

/**
 * Id Supabase dell'admin collegato a un utente MongoDB (stesso username),
 * se esiste: va escluso dal controllo quando quell'utente si rinomina, e
 * rinominato insieme a lui per non rompere il collegamento.
 */
export async function findLinkedAdminId(username: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}
