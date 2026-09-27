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
