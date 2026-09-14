import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const findOne = vi.fn();
const find = vi.fn();
const deleteOne = vi.fn();
const createIndex = vi.fn();
const countDocuments = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({
      insertOne,
      findOne,
      find,
      deleteOne,
      createIndex,
      countDocuments,
    }),
  }),
}));

import {
  createOAuthIdentity,
  findOAuthIdentity,
  deleteOAuthIdentity,
  countOAuthIdentitiesByUserId,
} from "./oauth-identities";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("oauth-identities", () => {
  it("createOAuthIdentity inserts a document and returns it with a string _id", async () => {
    insertOne.mockResolvedValue({ insertedId: { toString: () => "id-1" } });

    const result = await createOAuthIdentity({
      provider: "google",
      providerAccountId: "g-123",
      userId: "user-1",
      providerEmail: "a@b.com",
      providerEmailVerified: true,
    });

    expect(insertOne).toHaveBeenCalledTimes(1);
    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.provider).toBe("google");
    expect(inserted.providerAccountId).toBe("g-123");
    expect(inserted.userId).toBe("user-1");
    expect(result._id).toBe("id-1");
  });

  it("findOAuthIdentity returns null when nothing matches", async () => {
    findOne.mockResolvedValue(null);
    const result = await findOAuthIdentity("google", "missing");
    expect(result).toBeNull();
    expect(findOne).toHaveBeenCalledWith({ provider: "google", providerAccountId: "missing" });
  });

  it("deleteOAuthIdentity scopes deletion to the given userId and provider", async () => {
    deleteOne.mockResolvedValue({ deletedCount: 1 });
    const result = await deleteOAuthIdentity("user-1", "facebook");
    expect(deleteOne).toHaveBeenCalledWith({ userId: "user-1", provider: "facebook" });
    expect(result).toBe(true);
  });

  it("countOAuthIdentitiesByUserId returns the count", async () => {
    countDocuments.mockResolvedValue(2);
    const result = await countOAuthIdentitiesByUserId("user-1");
    expect(countDocuments).toHaveBeenCalledWith({ userId: "user-1" });
    expect(result).toBe(2);
  });
});
