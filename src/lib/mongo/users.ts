/**
 * CRUD utenti normali su MongoDB.
 * Collezione: "users"
 *
 * ⚠️ Solo lato server.
 */

import { getDb } from "./client";
import type { UserProfile, UserPublic, AdminRequestStatus, SuperAdminRequestStatus } from "@/types";
import { ObjectId, type WithId, type Document } from "mongodb";

const COLLECTION = "users";

// --------------- helpers ---------------

function toUserPublic(doc: WithId<Document>): UserPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, _id, ...rest } = doc as unknown as UserProfile & { _id: ObjectId };
  return { ...rest, _id: _id.toString() } as UserPublic;
}

function col() {
  return getDb().then((db) => db.collection(COLLECTION));
}

// --------------- Indexes (idempotent, called once at startup) ---------------

let indexesEnsured = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const c = await col();
  await c.createIndex({ email: 1 }, { unique: true });
  await c.createIndex({ username: 1 }, { unique: true });
  await c.createIndex({ adminRequest: 1 });
  await c.createIndex({ superAdminRequest: 1 });
  indexesEnsured = true;
}

// --------------- Create ---------------

export async function createUser(data: {
  email: string;
  username: string;
  passwordHash: string;
  nome: string;
  cognome: string;
  role: UserProfile["role"];
  ageGroup: UserProfile["ageGroup"];
  chiesa?: string;
  adminRequest?: boolean;
}): Promise<UserPublic> {
  await ensureIndexes();
  const c = await col();
  const now = new Date().toISOString();
  const doc: Omit<UserProfile, "_id"> = {
    email: data.email,
    username: data.username,
    passwordHash: data.passwordHash,
    nome: data.nome,
    cognome: data.cognome,
    role: data.role,
    ageGroup: data.ageGroup,
    chiesa: data.chiesa,
    attivo: true,
    emailVerificata: false,
    adminRequest: data.adminRequest ? "pending" : "none",
    adminRequestDate: data.adminRequest ? now : undefined,
    superAdminRequest: "none",
    createdAt: now,
    updatedAt: now,
  };
  const result = await c.insertOne(doc);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...pub } = doc;
  return { ...pub, _id: result.insertedId.toString() } as UserPublic;
}

// --------------- Read ---------------

export async function findUserByEmail(email: string): Promise<(UserProfile & { _id: string }) | null> {
  const c = await col();
  const doc = await c.findOne({ email });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() } as unknown as UserProfile & { _id: string };
}

export async function findUserByUsername(username: string): Promise<(UserProfile & { _id: string }) | null> {
  const c = await col();
  const doc = await c.findOne({ username });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() } as unknown as UserProfile & { _id: string };
}

export async function findUserById(id: string): Promise<UserPublic | null> {
  const c = await col();
  if (!ObjectId.isValid(id)) return null;
  const doc = await c.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toUserPublic(doc);
}

export async function findUserByIdFull(id: string): Promise<(UserProfile & { _id: string }) | null> {
  const c = await col();
  if (!ObjectId.isValid(id)) return null;
  const doc = await c.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() } as unknown as UserProfile & { _id: string };
}

export async function listUsers(opts?: {
  page?: number;
  limit?: number;
  adminRequestFilter?: AdminRequestStatus;
}): Promise<{ users: UserPublic[]; total: number }> {
  const c = await col();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (opts?.adminRequestFilter) {
    filter.adminRequest = opts.adminRequestFilter;
  }

  const [docs, total] = await Promise.all([
    c.find(filter, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    c.countDocuments(filter),
  ]);

  return {
    users: docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as UserPublic),
    total,
  };
}

// --------------- Update ---------------

export async function updateUser(
  id: string,
  data: Partial<Pick<UserProfile, "nome" | "cognome" | "role" | "ageGroup" | "chiesa" | "attivo" | "emailVerificata" | "adminRequest" | "superAdminRequest" | "superAdminRequestDate">>
): Promise<UserPublic | null> {
  const c = await col();
  if (!ObjectId.isValid(id)) return null;
  const result = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as unknown as UserPublic;
}

export async function updateUserLastAccess(id: string): Promise<void> {
  const c = await col();
  if (!ObjectId.isValid(id)) return;
  await c.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ultimoAccesso: new Date().toISOString() } }
  );
}

export async function updateUserEmail(
  id: string,
  email: string
): Promise<{ success: boolean; error?: string; user?: UserPublic }> {
  const existing = await findUserByEmail(email);
  if (existing && existing._id !== id) {
    return { success: false, error: "Email già in uso da un altro account" };
  }
  const c = await col();
  if (!ObjectId.isValid(id)) return { success: false, error: "ID non valido" };
  const result = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { email, updatedAt: new Date().toISOString() } },
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!result) return { success: false, error: "Utente non trovato" };
  return { success: true, user: { ...result, _id: result._id.toString() } as unknown as UserPublic };
}

export async function updateUserUsername(
  id: string,
  username: string
): Promise<{ success: boolean; error?: string; user?: UserPublic }> {
  const existing = await findUserByUsername(username);
  if (existing && existing._id !== id) {
    return { success: false, error: "Username già in uso da un altro account" };
  }
  const c = await col();
  if (!ObjectId.isValid(id)) return { success: false, error: "ID non valido" };
  const result = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { username, updatedAt: new Date().toISOString() } },
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!result) return { success: false, error: "Utente non trovato" };
  return { success: true, user: { ...result, _id: result._id.toString() } as unknown as UserPublic };
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
  const c = await col();
  if (!ObjectId.isValid(id)) return false;
  const result = await c.updateOne(
    { _id: new ObjectId(id) },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } }
  );
  return result.modifiedCount === 1;
}

// --------------- Admin Request ---------------

export async function updateAdminRequest(
  id: string,
  status: AdminRequestStatus
): Promise<UserPublic | null> {
  const c = await col();
  if (!ObjectId.isValid(id)) return null;
  const result = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { adminRequest: status, updatedAt: new Date().toISOString() } },
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as unknown as UserPublic;
}

export async function getPendingAdminRequests(): Promise<UserPublic[]> {
  const c = await col();
  const docs = await c
    .find({ adminRequest: "pending" }, { projection: { passwordHash: 0 } })
    .sort({ adminRequestDate: 1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as UserPublic);
}

export async function updateSuperAdminRequest(
  id: string,
  status: SuperAdminRequestStatus
): Promise<UserPublic | null> {
  const c = await col();
  if (!ObjectId.isValid(id)) return null;

  const now = new Date().toISOString();
  const update: { $set: Record<string, unknown>; $unset?: Record<string, string> } = {
    $set: {
      superAdminRequest: status,
      updatedAt: now,
    },
  };

  if (status === "pending") {
    update.$set.superAdminRequestDate = now;
  } else {
    update.$unset = { superAdminRequestDate: "" };
  }

  const result = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    update,
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as unknown as UserPublic;
}

export async function getPendingSuperAdminRequests(): Promise<UserPublic[]> {
  const c = await col();
  const docs = await c
    .find(
      { adminRequest: "approved", superAdminRequest: "pending" },
      { projection: { passwordHash: 0 } }
    )
    .sort({ superAdminRequestDate: 1 })
    .toArray();

  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as UserPublic);
}

// --------------- Delete ---------------

export async function deleteUser(id: string): Promise<boolean> {
  const c = await col();
  if (!ObjectId.isValid(id)) return false;
  const result = await c.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
