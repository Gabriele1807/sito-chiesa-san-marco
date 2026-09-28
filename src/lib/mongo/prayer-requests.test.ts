import { describe, it, expect, vi } from "vitest";

vi.mock("./client", () => ({ getDb: vi.fn() }));

import { validatePrayerRequest } from "./prayer-requests";

const valid = { tipo: "malati", intenzione: "Per la guarigione di Maria", consenso: true };

describe("validatePrayerRequest", () => {
  it("accepts a minimal anonymous request", () => {
    expect(validatePrayerRequest(valid)).toEqual({
      ok: true,
      data: {
        tipo: "malati",
        intenzione: "Per la guarigione di Maria",
        nome: undefined,
        email: undefined,
        leggibileInLiturgia: false,
      },
    });
  });

  it("requires explicit privacy consent", () => {
    expect(validatePrayerRequest({ ...valid, consenso: "true" })).toEqual({
      ok: false,
      error: "consent",
    });
    expect(validatePrayerRequest({ ...valid, consenso: undefined })).toEqual({
      ok: false,
      error: "consent",
    });
  });

  it("validates type, intention length, name and email", () => {
    expect(validatePrayerRequest({ ...valid, tipo: "spam" })).toEqual({ ok: false, error: "tipo" });
    expect(validatePrayerRequest({ ...valid, intenzione: "  " })).toEqual({
      ok: false,
      error: "intenzione",
    });
    expect(validatePrayerRequest({ ...valid, intenzione: "x".repeat(1501) })).toEqual({
      ok: false,
      error: "intenzione",
    });
    expect(validatePrayerRequest({ ...valid, nome: { $ne: null } })).toEqual({
      ok: false,
      error: "nome",
    });
    expect(validatePrayerRequest({ ...valid, email: "non-una-mail" })).toEqual({
      ok: false,
      error: "email",
    });
  });

  it("normalises optional fields and ignores unknown ones", () => {
    const result = validatePrayerRequest({
      ...valid,
      nome: "  Giorgio  ",
      email: " Giorgio@Example.COM ",
      leggibileInLiturgia: true,
      stato: "archiviata",
      id: "x",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        tipo: "malati",
        intenzione: "Per la guarigione di Maria",
        nome: "Giorgio",
        email: "giorgio@example.com",
        leggibileInLiturgia: true,
      },
    });
  });
});

describe("archiveStalePrayerRequests", () => {
  it("archives only requests older than 60 days that are not archived yet", async () => {
    const updateMany = vi.fn(async () => ({ modifiedCount: 2 }));
    const { getDb } = await import("./client");
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue({
      collection: () => ({ createIndex: vi.fn(), updateMany }),
    });
    const { archiveStalePrayerRequests } = await import("./prayer-requests");

    const now = new Date("2026-09-28T12:00:00Z");
    expect(await archiveStalePrayerRequests(now)).toBe(2);
    const [filter, update] = updateMany.mock.calls[0] as unknown as [
      { stato: unknown; createdAt: { $lt: string } },
      { $set: { stato: string; deleteAfter: Date } },
    ];
    expect(filter.stato).toEqual({ $ne: "archiviata" });
    expect(filter.createdAt.$lt).toBe("2026-07-30T12:00:00.000Z");
    expect(update.$set.stato).toBe("archiviata");
    expect(update.$set.deleteAfter.toISOString()).toBe("2026-12-27T12:00:00.000Z");
  });
});
