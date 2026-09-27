import { describe, it, expect, vi, beforeEach } from "vitest";

const docs: Record<string, unknown>[] = [];
vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({
      createIndex: vi.fn(),
      deleteMany: async (filter: { userId: string }) => {
        for (let i = docs.length - 1; i >= 0; i--)
          if (docs[i].userId === filter.userId && docs[i].usedAt === null) docs.splice(i, 1);
      },
      insertOne: async (doc: Record<string, unknown>) => docs.push(doc),
      findOneAndUpdate: async (
        filter: { tokenHash: string; expiresAt: { $gt: Date } },
        update: { $set: { usedAt: Date } }
      ) => {
        const doc = docs.find(
          (d) =>
            d.tokenHash === filter.tokenHash &&
            d.usedAt === null &&
            (d.expiresAt as Date) > filter.expiresAt.$gt
        );
        if (doc) Object.assign(doc, update.$set);
        return doc ?? null;
      },
      findOne: async (filter: { userId: string }) =>
        docs
          .filter((d) => d.userId === filter.userId)
          .sort((a, b) => +(b.createdAt as Date) - +(a.createdAt as Date))[0] ?? null,
    }),
  }),
}));

import {
  createEmailVerificationToken,
  consumeEmailVerificationToken,
  secondsUntilNextVerificationEmail,
} from "./email-verification-tokens";

describe("email verification tokens", () => {
  beforeEach(() => {
    docs.length = 0;
  });

  it("stores only a hash and can be used once", async () => {
    const { rawToken } = await createEmailVerificationToken("u1", "mario@example.com");
    expect(JSON.stringify(docs)).not.toContain(rawToken);
    expect(await consumeEmailVerificationToken(rawToken)).toEqual({
      userId: "u1",
      email: "mario@example.com",
    });
    expect(await consumeEmailVerificationToken(rawToken)).toBeNull();
  });

  it("invalidates the previous link when a new one is created", async () => {
    const first = await createEmailVerificationToken("u1", "mario@example.com");
    const second = await createEmailVerificationToken("u1", "mario@example.com");
    expect(await consumeEmailVerificationToken(first.rawToken)).toBeNull();
    expect(await consumeEmailVerificationToken(second.rawToken)).not.toBeNull();
  });

  it("rejects malformed tokens without querying", async () => {
    expect(await consumeEmailVerificationToken("../etc")).toBeNull();
    expect(await consumeEmailVerificationToken({ $ne: null } as unknown as string)).toBeNull();
  });

  it("asks to wait before sending another link", async () => {
    await createEmailVerificationToken("u1", "mario@example.com");
    const wait = await secondsUntilNextVerificationEmail("u1", new Date(Date.now() + 20_000));
    expect(wait).toBeGreaterThan(35);
    expect(wait).toBeLessThanOrEqual(40);
    expect(await secondsUntilNextVerificationEmail("u1", new Date(Date.now() + 61_000))).toBe(0);
  });
});
