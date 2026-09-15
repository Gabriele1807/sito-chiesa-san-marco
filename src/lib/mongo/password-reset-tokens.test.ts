import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const updateMany = vi.fn();
const findOne = vi.fn();
const updateOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: () => ({ insertOne, updateMany, findOne, updateOne, createIndex }),
  }),
}));

import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from "./password-reset-tokens";
import { createHash } from "node:crypto";

describe("password-reset-tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertOne.mockResolvedValue({ insertedId: { toString: () => "id1" } });
  });

  it("creates a token, invalidates prior ones, and stores only the hash", async () => {
    const { rawToken, expiresAt } = await createPasswordResetToken("user-1");

    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(updateMany).toHaveBeenCalledWith(
      { userId: "user-1", usedAt: null },
      { $set: { usedAt: expect.any(Date) } }
    );
    const insertedDoc = insertOne.mock.calls[0][0];
    expect(insertedDoc.tokenHash).toBe(createHash("sha256").update(rawToken).digest("hex"));
    expect(insertedDoc.tokenHash).not.toBe(rawToken);
  });

  it("finds a token by its raw value via hash lookup", async () => {
    findOne.mockResolvedValue({ _id: { toString: () => "id1" }, userId: "user-1" });

    const found = await findValidPasswordResetToken("deadbeef");

    expect(findOne).toHaveBeenCalledWith({
      tokenHash: createHash("sha256").update("deadbeef").digest("hex"),
      usedAt: null,
      expiresAt: { $gt: expect.any(Date) },
    });
    expect(found).toEqual({ _id: "id1", userId: "user-1" });
  });

  it("returns null when no matching token exists", async () => {
    findOne.mockResolvedValue(null);
    const found = await findValidPasswordResetToken("nope");
    expect(found).toBeNull();
  });

  it("marks a token used by id", async () => {
    await markPasswordResetTokenUsed("507f1f77bcf86cd799439011");
    expect(updateOne).toHaveBeenCalled();
  });
});
