/**
 * Data dell'ultimo cambio password di ogni admin (Supabase `admin_users`).
 * Collezione: "admin_password_changes", `_id` = id admin.
 *
 * Equivalente admin di `passwordChangedAt` degli utenti (§6.4): dopo un
 * cambio/reset password `validateSession` rifiuta i JWT admin emessi prima,
 * così le sessioni aperte su altri dispositivi (anche di chi conosceva la
 * vecchia password) non restano valide fino alla scadenza. Sta in MongoDB
 * per non richiedere una migrazione dello schema Supabase.
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import { supabaseAdmin } from "@/lib/supabase/server";

const COLLECTION = "admin_password_changes";

function col() {
  return getDb().then((db) => db.collection<{ _id: string; changedAt: Date }>(COLLECTION));
}

/** Registra il cambio password: invalida tutte le sessioni admin emesse prima. */
export async function markAdminPasswordChanged(adminId: string): Promise<void> {
  const c = await col();
  await c.updateOne({ _id: adminId }, { $set: { changedAt: new Date() } }, { upsert: true });
}

/** Come sopra, per gli admin collegati a un account utente tramite username. */
export async function markAdminPasswordChangedByUsername(username: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (data?.id) await markAdminPasswordChanged(data.id);
}

/** Secondi Unix dell'ultimo cambio password, o null se mai registrato. */
export async function getAdminPasswordChangedAt(adminId: string): Promise<number | null> {
  const c = await col();
  const doc = await c.findOne({ _id: adminId });
  return doc ? Math.floor(doc.changedAt.getTime() / 1000) : null;
}
