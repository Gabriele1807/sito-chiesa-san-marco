import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const updateOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({ insertOne, updateOne, createIndex }),
  }),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async (pwd: string) => `hashed:${pwd}`),
}));

import { createUser, createOAuthUser, setHasPassword } from "./users";
import { hashPassword } from "@/lib/auth/password";

beforeEach(() => {
  vi.clearAllMocks();
  insertOne.mockResolvedValue({ insertedId: { toString: () => "user-1" } });
});

describe("users.ts — hasPassword handling", () => {
  it("createUser defaults hasPassword to true when not provided", async () => {
    await createUser({
      email: "a@b.com",
      username: "abuser",
      passwordHash: "already-hashed",
      nome: "A",
      cognome: "B",
      role: "credente",
      ageGroup: "19-29",
    });
    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.hasPassword).toBe(true);
  });

  it("createOAuthUser creates a user with hasPassword:false and an unusable password hash", async () => {
    const result = await createOAuthUser({
      email: "oauth@b.com",
      username: "oauthuser",
      nome: "O",
      cognome: "U",
      role: "credente",
      ageGroup: "19-29",
    });

    expect(hashPassword).toHaveBeenCalledTimes(1);
    const [randomToken] = (hashPassword as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(typeof randomToken).toBe("string");
    expect(randomToken.length).toBeGreaterThanOrEqual(32);

    const inserted = insertOne.mock.calls[0][0];
    expect(inserted.hasPassword).toBe(false);
    expect(inserted.passwordHash).toBe(`hashed:${randomToken}`);
    expect(result._id).toBe("user-1");
  });

  it("setHasPassword updates the flag for the given user id", async () => {
    await setHasPassword("507f191e810c19729de860ea", true);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { hasPassword: true, updatedAt: expect.any(String) } }
    );
  });
});
