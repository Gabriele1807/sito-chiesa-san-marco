import { describe, it, expect, vi, beforeEach } from "vitest";

// Mini implementazione in memoria di $max/$inc con le stesse garanzie di
// MongoDB: ogni operazione sul contatore è applicata per intero, una alla volta.
const counters = new Map<string, number>();
const existingIds: Record<string, string[]> = { eventi: ["1", "7", "abc"] };

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: (name: string) => {
      if (name === "content_counters") {
        return {
          updateOne: async ({ _id }: { _id: string }, update: { $max: { seq: number } }) => {
            counters.set(_id, Math.max(counters.get(_id) ?? 0, update.$max.seq));
          },
          findOneAndUpdate: async ({ _id }: { _id: string }, update: { $inc: { seq: number } }) => {
            // Cede il controllo prima dell'aggiornamento per mescolare le chiamate concorrenti.
            await Promise.resolve();
            const seq = (counters.get(_id) ?? 0) + update.$inc.seq;
            counters.set(_id, seq);
            return { _id, seq };
          },
        };
      }
      return {
        find: () => ({ toArray: async () => (existingIds[name] ?? []).map((id) => ({ id })) }),
      };
    },
  }),
}));

import { nextId } from "./content";

describe("nextId", () => {
  beforeEach(() => counters.clear());

  it("continues after the highest existing numeric id", async () => {
    expect(await nextId("eventi")).toBe("8");
    expect(await nextId("eventi")).toBe("9");
  });

  it("never hands out the same id to concurrent creations", async () => {
    const ids = await Promise.all(Array.from({ length: 20 }, () => nextId("icone")));
    expect(new Set(ids).size).toBe(20);
  });
});
