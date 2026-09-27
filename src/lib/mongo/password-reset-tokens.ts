/**
 * Token di reset password. Collezione: "password_reset_tokens".
 * Indice TTL su expiresAt: pulizia automatica — vedi design spec §4.
 * Il raw token non viene mai salvato, solo il suo hash SHA-256 (chiave di
 * lookup, non un segreto da verificare lentamente — a differenza della
 * password stessa, che usa bcrypt in src/lib/auth/password.ts).
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import { ObjectId } from "mongodb";
import { randomBytes, createHash } from "node:crypto";

const COLLECTION = "password_reset_tokens";

function expirationMinutes(): number {
  const raw = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES);
  if (!Number.isFinite(raw)) return 60;
  return Math.min(60, Math.max(5, raw));
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

export async function ensurePasswordResetTokenIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await c.createIndex({ userId: 1 });
  indexesEnsured = true;
}

export async function createPasswordResetToken(
  userId: string,
  meta?: { requestIp?: string; userAgent?: string }
): Promise<{ rawToken: string; expiresAt: Date }> {
  await ensurePasswordResetTokenIndexes();
  const c = await col();

  // Invalida eventuali token precedenti ancora attivi per lo stesso utente e
  // marca come superati TUTTI i precedenti, compresi quelli consumati da un
  // reset ancora in corso: releasePasswordResetToken non può riattivare un
  // token superato, quindi non restano mai due link validi contemporaneamente.
  const supersededAt = new Date();
  await c.updateMany({ userId, usedAt: null }, { $set: { usedAt: supersededAt } });
  await c.updateMany({ userId, supersededAt: null }, { $set: { supersededAt } });

  const rawToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes() * 60 * 1000);

  await c.insertOne({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    usedAt: null,
    supersededAt: null,
    createdAt: now,
    requestIp: meta?.requestIp,
    userAgent: meta?.userAgent,
  });

  return { rawToken, expiresAt };
}

/**
 * Valida e consuma il token in un'unica operazione atomica: il token viene
 * marcato usato nello stesso `findOneAndUpdate` che lo trova. Due richieste
 * concorrenti con lo stesso link non possono quindi reimpostare la password
 * entrambe (con find + update separati, entrambe avrebbero visto
 * `usedAt: null` prima che l'altra lo scrivesse).
 */
export async function consumePasswordResetToken(
  rawToken: string
): Promise<{ _id: string; userId: string; consumedAt: Date } | null> {
  const c = await col();
  const now = new Date();
  const doc = await c.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), usedAt: null, supersededAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } }
  );
  if (!doc) return null;
  return { _id: doc._id.toString(), userId: doc.userId as string, consumedAt: now };
}

/**
 * Annulla un consumo se il cambio password che lo seguiva è fallito prima di
 * salvare la nuova password, così il link dell'email resta utilizzabile.
 * Solo se il token porta ancora esattamente quel timestamp di consumo e non
 * è stato superato da una richiesta più recente (`supersededAt`, impostato
 * da createPasswordResetToken anche sui token in corso di utilizzo).
 * `supersededAt: null` corrisponde anche ai documenti creati prima che il
 * campo esistesse.
 */
export async function releasePasswordResetToken(id: string, consumedAt: Date): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const c = await col();
  await c.updateOne(
    { _id: new ObjectId(id), usedAt: consumedAt, supersededAt: null },
    { $set: { usedAt: null } }
  );
}
