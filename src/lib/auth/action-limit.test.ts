import { describe, it, expect, vi, beforeEach } from "vitest";

const counters = new Map<string, number>();
vi.mock("@/lib/mongo/client", () => ({
  getDb: async () => ({
    collection: () => ({
      createIndex: vi.fn(),
      findOneAndUpdate: async ({ _id }: { _id: string }) => {
        const count = (counters.get(_id) ?? 0) + 1;
        counters.set(_id, count);
        return { _id, count };
      },
    }),
  }),
}));

import { consumeActionLimit } from "./action-limit";

const limit = { action: "test", max: 3, windowSeconds: 3600 };

describe("consumeActionLimit", () => {
  beforeEach(() => counters.clear());

  it("allows up to the limit in a window, then blocks", async () => {
    const now = new Date("2026-09-28T10:10:00Z");
    const results = [];
    for (let i = 0; i < 4; i++)
      results.push((await consumeActionLimit(limit, "1.2.3.4", now)).allowed);
    expect(results).toEqual([true, true, true, false]);
    expect((await consumeActionLimit(limit, "1.2.3.4", now)).retryAfterSeconds).toBe(50 * 60);
  });

  it("counts each subject and each window separately and stores no raw IP", async () => {
    const now = new Date("2026-09-28T10:10:00Z");
    for (let i = 0; i < 3; i++) await consumeActionLimit(limit, "1.2.3.4", now);
    expect((await consumeActionLimit(limit, "5.6.7.8", now)).allowed).toBe(true);
    expect(
      (await consumeActionLimit(limit, "1.2.3.4", new Date("2026-09-28T11:00:01Z"))).allowed
    ).toBe(true);
    expect([...counters.keys()].join()).not.toContain("1.2.3.4");
  });
});
