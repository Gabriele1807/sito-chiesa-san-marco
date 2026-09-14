/**
 * Identità esterne (Google, Facebook) collegate ad account utente o admin.
 * Collezione: "oauth_identities"
 *
 * ⚠️ Solo lato server. Il collegamento nasce sempre da
 * (provider, providerAccountId), mai dall'email — vedi design spec §2.1.
 *
 * `accountType` distingue se `userId` referenzia un utente normale
 * (collezione MongoDB "users") o un admin (tabella Supabase "admin_users") —
 * i due spazi di identificatori sono distinti (ObjectId Mongo vs UUID
 * Supabase), quindi il campo è indispensabile per sapere quale risolvere.
 * I documenti creati prima dell'introduzione di questo campo non hanno
 * `accountType`: sono trattati come `"user"` (unico tipo esistente allora).
 */

import { getDb } from "./client";
import { ObjectId, type WithId, type Document } from "mongodb";

const COLLECTION = "oauth_identities";

export type OAuthProvider = "google" | "facebook";
export type OAuthAccountType = "user" | "admin";

export interface OAuthIdentity {
  _id: string;
  provider: OAuthProvider;
  providerAccountId: string;
  userId: string;
  accountType: OAuthAccountType;
  providerEmail?: string;
  providerEmailVerified?: boolean;
  linkedAt: string;
  lastLoginAt?: string;
}

function toIdentity(doc: WithId<Document>): OAuthIdentity {
  const { _id, ...rest } = doc;
  return {
    ...(rest as Omit<OAuthIdentity, "_id" | "accountType">),
    accountType: (rest.accountType as OAuthAccountType | undefined) ?? "user",
    _id: _id.toString(),
  };
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

let indexesEnsured = false;

export async function ensureOAuthIdentityIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ provider: 1, providerAccountId: 1 }, { unique: true });
  await c.createIndex({ userId: 1, accountType: 1 });
  indexesEnsured = true;
}

export async function findOAuthIdentity(
  provider: OAuthProvider,
  providerAccountId: string
): Promise<OAuthIdentity | null> {
  const c = await col();
  const doc = await c.findOne({ provider, providerAccountId });
  if (!doc) return null;
  return toIdentity(doc);
}

export async function findOAuthIdentitiesByUserId(
  userId: string,
  accountType: OAuthAccountType = "user"
): Promise<OAuthIdentity[]> {
  const c = await col();
  const filter =
    accountType === "user"
      ? { userId, $or: [{ accountType: "user" }, { accountType: { $exists: false } }] }
      : { userId, accountType };
  const docs = await c.find(filter).toArray();
  return docs.map(toIdentity);
}

export async function createOAuthIdentity(data: {
  provider: OAuthProvider;
  providerAccountId: string;
  userId: string;
  accountType: OAuthAccountType;
  providerEmail?: string;
  providerEmailVerified?: boolean;
}): Promise<OAuthIdentity> {
  await ensureOAuthIdentityIndexes();
  const c = await col();
  const now = new Date().toISOString();
  const doc = {
    provider: data.provider,
    providerAccountId: data.providerAccountId,
    userId: data.userId,
    accountType: data.accountType,
    providerEmail: data.providerEmail,
    providerEmailVerified: data.providerEmailVerified,
    linkedAt: now,
  };
  const result = await c.insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function touchOAuthIdentityLogin(
  provider: OAuthProvider,
  providerAccountId: string
): Promise<void> {
  const c = await col();
  await c.updateOne(
    { provider, providerAccountId },
    { $set: { lastLoginAt: new Date().toISOString() } }
  );
}

export async function deleteOAuthIdentity(
  userId: string,
  provider: OAuthProvider,
  accountType: OAuthAccountType = "user"
): Promise<boolean> {
  const c = await col();
  const filter =
    accountType === "user"
      ? { userId, provider, $or: [{ accountType: "user" }, { accountType: { $exists: false } }] }
      : { userId, provider, accountType };
  const result = await c.deleteOne(filter);
  return result.deletedCount === 1;
}

export async function countOAuthIdentitiesByUserId(
  userId: string,
  accountType: OAuthAccountType = "user"
): Promise<number> {
  const c = await col();
  const filter =
    accountType === "user"
      ? { userId, $or: [{ accountType: "user" }, { accountType: { $exists: false } }] }
      : { userId, accountType };
  return c.countDocuments(filter);
}

// Suppress unused-import lint if ObjectId isn't referenced beyond typing elsewhere.
void ObjectId;
