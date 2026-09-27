import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";

const updateOne = vi.fn();
const findOne = vi.fn();
const createIndex = vi.fn();
vi.mock("./client", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: () => ({ updateOne, findOne, createIndex }),
  }),
}));

import { revokeUserSessionToken, isUserSessionTokenRevoked } from "./revoked-sessions";

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

describe("revoked-sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores only the token hash, expiring with the token (TTL index)", async () => {
    await revokeUserSessionToken("raw.jwt.token", 2_000_000_000, "u1");

    expect(createIndex).toHaveBeenCalledWith({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    const [filter, update] = updateOne.mock.calls[0];
    expect(filter).toEqual({ tokenHash: sha("raw.jwt.token") });
    expect(JSON.stringify(update)).not.toContain("raw.jwt.token");
    expect(update.$setOnInsert.expiresAt).toEqual(new Date(2_000_000_000 * 1000));
  });

  it("looks tokens up by hash", async () => {
    findOne.mockResolvedValueOnce({ _id: "x" }).mockResolvedValueOnce(null);
    expect(await isUserSessionTokenRevoked("a")).toBe(true);
    expect(await isUserSessionTokenRevoked("b")).toBe(false);
    expect(findOne.mock.calls[0][0]).toEqual({ tokenHash: sha("a") });
  });
});
