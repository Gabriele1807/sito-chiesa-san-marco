import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const findOne = vi.fn();
const deleteOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({ insertOne, findOne, deleteOne, createIndex }),
  }),
}));

vi.mock("mongodb", async () => {
  const actual = await vi.importActual<typeof import("mongodb")>("mongodb");
  return {
    ...actual,
    ObjectId: class {
      id: string;
      constructor(id?: string) {
        this.id = id ?? "generated";
      }
      static isValid(id: string) {
        return typeof id === "string" && id.length > 0;
      }
      toString() {
        return this.id;
      }
    },
  };
});

import {
  createPendingOAuthRegistration,
  findPendingOAuthRegistrationById,
  deletePendingOAuthRegistration,
} from "./pending-oauth-registrations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pending-oauth-registrations", () => {
  it("createPendingOAuthRegistration sets a 24h expiresAt and stores provider data", async () => {
    insertOne.mockResolvedValue({ insertedId: { toString: () => "pending-1" } });

    const before = Date.now();
    const result = await createPendingOAuthRegistration({
      provider: "google",
      providerAccountId: "g-1",
      providerEmail: "a@b.com",
      providerEmailVerified: true,
      nome: "Mario",
      cognome: "Rossi",
    });
    const after = Date.now();

    expect(insertOne).toHaveBeenCalledTimes(1);
    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.provider).toBe("google");
    expect(inserted.nome).toBe("Mario");
    const ttlMs = inserted.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
    expect(inserted.expiresAt.getTime()).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000);
    expect(result._id).toBe("pending-1");
  });

  it("findPendingOAuthRegistrationById returns null for an invalid id", async () => {
    const result = await findPendingOAuthRegistrationById("");
    expect(result).toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });

  it("findPendingOAuthRegistrationById looks up by _id when valid", async () => {
    findOne.mockResolvedValue({
      _id: { toString: () => "pending-1" },
      provider: "google",
      providerAccountId: "g-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: new Date(),
    });
    const result = await findPendingOAuthRegistrationById("pending-1");
    expect(result?._id).toBe("pending-1");
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("deletePendingOAuthRegistration deletes by id, ignoring invalid ids silently", async () => {
    await deletePendingOAuthRegistration("");
    expect(deleteOne).not.toHaveBeenCalled();

    await deletePendingOAuthRegistration("pending-1");
    expect(deleteOne).toHaveBeenCalledTimes(1);
  });
});
