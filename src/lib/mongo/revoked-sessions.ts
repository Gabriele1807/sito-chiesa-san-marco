/**
 * Revoca per-token delle sessioni utente (`user_session`), usata dal logout.
 * Collezione: "revoked_user_sessions".
 *
 * Si salva solo l'hash SHA-256 del JWT (il token in chiaro non tocca il DB)
 * con la sua scadenza naturale: un indice TTL elimina la voce quando il
 * token sarebbe comunque scaduto, quindi la collezione resta piccola.
 * MongoDB (sempre configurato) invece di Redis (opzionale) perché la revoca
 * deve valere su tutte le istanze serverless, non solo su quella del logout.
 *
 * ⚠️ Solo lato server.
 */

import { createHash } from "node:crypto";
import { getDb } from "./client";

const COLLECTION = "revoked_user_sessions";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ tokenHash: 1 }, { unique: true });
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  indexesEnsured = true;
}

export async function revokeUserSessionToken(
  token: string,
  expiresAtSeconds: number,
  userId: string
): Promise<void> {
  await ensureIndexes();
  const c = await col();
  await c.updateOne(
    { tokenHash: hashToken(token) },
    {
      $setOnInsert: {
        tokenHash: hashToken(token),
        userId,
        expiresAt: new Date(expiresAtSeconds * 1000),
        revokedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function isUserSessionTokenRevoked(token: string): Promise<boolean> {
  const c = await col();
  const doc = await c.findOne({ tokenHash: hashToken(token) }, { projection: { _id: 1 } });
  return doc !== null;
}
