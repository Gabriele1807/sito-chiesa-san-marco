import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const updateMany = vi.fn();
const findOneAndUpdate = vi.fn();
const updateOne = vi.fn();
const createIndex = vi.fn();

vi.mock("./client", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: () => ({ insertOne, updateMany, findOneAndUpdate, updateOne, createIndex }),
  }),
}));

import {
  createPasswordResetToken,
  consumePasswordResetToken,
  releasePasswordResetToken,
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

  it("finds and consumes a valid token in a single atomic operation", async () => {
    findOneAndUpdate.mockResolvedValue({ _id: { toString: () => "id1" }, userId: "user-1" });

    const consumed = await consumePasswordResetToken("deadbeef");

    expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        tokenHash: createHash("sha256").update("deadbeef").digest("hex"),
        usedAt: null,
        expiresAt: { $gt: expect.any(Date) },
      },
      { $set: { usedAt: expect.any(Date) } }
    );
    expect(consumed).toEqual({ _id: "id1", userId: "user-1", consumedAt: expect.any(Date) });
  });

  it("returns null when the token is unknown, expired or already used", async () => {
    findOneAndUpdate.mockResolvedValue(null);
    expect(await consumePasswordResetToken("nope")).toBeNull();
  });

  it("releases a token only if it still carries the exact consumption timestamp", async () => {
    const consumedAt = new Date("2026-09-26T10:00:00.000Z");
    await releasePasswordResetToken("507f1f77bcf86cd799439011", consumedAt);

    const [filter, update] = updateOne.mock.calls[0];
    expect(filter.usedAt).toBe(consumedAt);
    expect(filter._id.toString()).toBe("507f1f77bcf86cd799439011");
    expect(update).toEqual({ $set: { usedAt: null } });
  });
});
