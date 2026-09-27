/**
 * Registro delle attività admin. Collezione: "admin_audit_log".
 *
 * Una voce per ogni operazione che modifica dati dal pannello admin (crea,
 * modifica, elimina, approva…) e per login/logout admin: chi, cosa, quando.
 * Serve a capire chi ha cambiato un contenuto quando gli admin sono più di
 * uno, e come traccia in caso di accesso improprio.
 *
 * Nel riepilogo vanno solo titoli/nomi dei contenuti, mai dati personali di
 * iscritti o utenti oltre al minimo per riconoscerli, né password o token.
 * Le voci scadono dopo 365 giorni (indice TTL).
 *
 * La scrittura non deve mai far fallire l'operazione registrata: eventuali
 * errori vengono solo loggati.
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import { getAdminSession, type AdminUser } from "@/lib/auth/session";

const COLLECTION = "admin_audit_log";
const RETENTION_SECONDS = 365 * 24 * 60 * 60;
export const AUDIT_PAGE_SIZE_MAX = 100;

export type AuditAction =
  "create" | "update" | "delete" | "login" | "logout" | "approve" | "reject" | "revoke" | "send";

export interface AuditEntryInput {
  action: AuditAction;
  /** Area interessata, es. "eventi", "utenti", "avvisi". */
  entity: string;
  entityId?: string;
  /** Descrizione breve leggibile, es. `Evento "Festa di San Marco"`. */
  summary: string;
}

export interface AuditEntry extends AuditEntryInput {
  _id: string;
  at: string;
  adminId: string;
  adminUsername: string;
  adminNome: string;
}

type AuditActor = Pick<AdminUser, "id" | "username" | "nome" | "cognome">;

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await Promise.all([
    c.createIndex({ at: -1 }),
    c.createIndex({ entity: 1, at: -1 }),
    c.createIndex({ adminId: 1, at: -1 }),
    c.createIndex({ at: 1 }, { expireAfterSeconds: RETENTION_SECONDS, name: "at_ttl" }),
  ]);
  indexesEnsured = true;
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Registra un'azione di un admin noto. Non lancia mai. */
export async function logAdminAction(actor: AuditActor, entry: AuditEntryInput): Promise<void> {
  try {
    await ensureIndexes();
    const c = await col();
    await c.insertOne({
      at: new Date(),
      adminId: actor.id,
      adminUsername: actor.username,
      adminNome: clip(`${actor.nome ?? ""} ${actor.cognome ?? ""}`.trim(), 120),
      action: entry.action,
      entity: clip(entry.entity, 60),
      entityId: entry.entityId ? clip(entry.entityId, 128) : undefined,
      summary: clip(entry.summary, 300),
    });
  } catch (err) {
    console.error("[audit-log] scrittura fallita", {
      action: entry.action,
      entity: entry.entity,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

/**
 * Registra un'azione dell'admin della richiesta corrente (cookie
 * `admin_session`). Se non c'è una sessione admin valida non registra nulla.
 * Non lancia mai.
 */
export async function recordAdminAction(entry: AuditEntryInput): Promise<void> {
  try {
    const admin = await getAdminSession();
    if (admin) await logAdminAction(admin, entry);
  } catch (err) {
    console.error(
      "[audit-log] sessione non leggibile",
      err instanceof Error ? err.message : "unknown"
    );
  }
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  adminUsername?: string;
  /** Date ISO (YYYY-MM-DD), inclusive. */
  from?: string;
  to?: string;
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function parseDay(value: string | undefined, endOfDay: boolean): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listAuditLog(
  query: AuditQuery = {}
): Promise<{ entries: AuditEntry[]; total: number; page: number; limit: number }> {
  await ensureIndexes();
  const c = await col();
  const page = clampInt(query.page, 1, 1, 10_000);
  const limit = clampInt(query.limit, 50, 1, AUDIT_PAGE_SIZE_MAX);

  // Solo confronti di uguaglianza su stringhe semplici: nessun operatore
  // MongoDB può arrivare dai parametri della query string.
  const filter: Record<string, unknown> = {};
  if (typeof query.entity === "string" && query.entity) filter.entity = query.entity.slice(0, 60);
  if (typeof query.action === "string" && query.action) filter.action = query.action.slice(0, 20);
  if (typeof query.adminUsername === "string" && query.adminUsername) {
    filter.adminUsername = query.adminUsername.slice(0, 60);
  }
  const from = parseDay(query.from, false);
  const to = parseDay(query.to, true);
  if (from || to) {
    filter.at = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }

  const [docs, total] = await Promise.all([
    c
      .find(filter)
      .sort({ at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    c.countDocuments(filter),
  ]);

  return {
    entries: docs.map((d) => ({
      _id: d._id.toString(),
      at: (d.at as Date).toISOString(),
      adminId: d.adminId as string,
      adminUsername: d.adminUsername as string,
      adminNome: (d.adminNome as string) ?? "",
      action: d.action as AuditAction,
      entity: d.entity as string,
      entityId: d.entityId as string | undefined,
      summary: d.summary as string,
    })),
    total,
    page,
    limit,
  };
}

/** Valori distinti per i filtri della pagina di consultazione. */
export async function getAuditFilterOptions(): Promise<{ entities: string[]; admins: string[] }> {
  await ensureIndexes();
  const c = await col();
  const [entities, admins] = await Promise.all([c.distinct("entity"), c.distinct("adminUsername")]);
  return {
    entities: (entities as string[]).sort(),
    admins: (admins as string[]).sort(),
  };
}
