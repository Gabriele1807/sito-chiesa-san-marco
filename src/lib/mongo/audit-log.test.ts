import { describe, it, expect, vi, beforeEach } from "vitest";

const insertOne = vi.fn();
const findCalls: { filter: Record<string, unknown>; skip?: number; limit?: number }[] = [];

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({
      createIndex: vi.fn(),
      insertOne,
      countDocuments: async () => 0,
      distinct: async () => [],
      find: (filter: Record<string, unknown>) => {
        const call: (typeof findCalls)[number] = { filter };
        findCalls.push(call);
        const cursor = {
          sort: () => cursor,
          skip: (n: number) => ((call.skip = n), cursor),
          limit: (n: number) => ((call.limit = n), cursor),
          toArray: async () => [],
        };
        return cursor;
      },
    }),
  }),
}));

const getAdminSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getAdminSession: () => getAdminSession() }));

import { logAdminAction, recordAdminAction, listAuditLog } from "./audit-log";

const admin = { id: "a1", username: "mario", nome: "Mario", cognome: "Rossi" };

describe("audit log — scrittura", () => {
  beforeEach(() => {
    insertOne.mockReset();
    getAdminSession.mockReset();
  });

  it("stores who did what, with a clipped summary", async () => {
    await logAdminAction(admin, {
      action: "create",
      entity: "eventi",
      entityId: "7",
      summary: "x".repeat(500),
    });
    const doc = insertOne.mock.calls[0][0];
    expect(doc).toMatchObject({
      adminId: "a1",
      adminUsername: "mario",
      adminNome: "Mario Rossi",
      action: "create",
    });
    expect(doc.at).toBeInstanceOf(Date);
    expect(doc.summary.length).toBe(300);
  });

  it("never makes the logged operation fail", async () => {
    insertOne.mockRejectedValue(new Error("db down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      logAdminAction(admin, { action: "delete", entity: "icone", summary: "Icona" })
    ).resolves.toBeUndefined();
    error.mockRestore();
  });

  it("recordAdminAction uses the current admin session and skips without one", async () => {
    getAdminSession.mockResolvedValueOnce(admin);
    await recordAdminAction({ action: "update", entity: "orari", summary: "Orari di Lunedì" });
    expect(insertOne).toHaveBeenCalledTimes(1);

    getAdminSession.mockResolvedValueOnce(null);
    await recordAdminAction({ action: "update", entity: "orari", summary: "Orari di Lunedì" });
    expect(insertOne).toHaveBeenCalledTimes(1);
  });
});

describe("audit log — consultazione", () => {
  beforeEach(() => {
    findCalls.length = 0;
  });

  it("clamps pagination", async () => {
    await listAuditLog({ page: -3, limit: 10_000 });
    expect(findCalls[0]).toMatchObject({ skip: 0, limit: 100 });
  });

  it("ignores non-string filters (no MongoDB operators from the query)", async () => {
    await listAuditLog({ entity: { $ne: null } as unknown as string, adminUsername: "mario" });
    expect(findCalls[0].filter).toEqual({ adminUsername: "mario" });
  });

  it("turns a day range into an inclusive date filter and ignores malformed dates", async () => {
    await listAuditLog({ from: "2026-09-01", to: "2026-09-30" });
    expect(findCalls[0].filter.at).toEqual({
      $gte: new Date("2026-09-01T00:00:00.000Z"),
      $lte: new Date("2026-09-30T23:59:59.999Z"),
    });
    await listAuditLog({ from: "ieri" });
    expect(findCalls[1].filter).toEqual({});
  });
});
