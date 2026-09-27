import { describe, it, expect, vi } from "vitest";

vi.mock("./client", () => ({ getDb: vi.fn() }));

import { validateAvviso, filterActiveAvvisi, localizeAvviso, type Avviso } from "./announcements";

function avviso(overrides: Partial<Avviso>): Avviso {
  return {
    id: "a",
    titolo: "Titolo",
    messaggio: "Messaggio",
    livello: "info",
    pubblicato: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("validateAvviso", () => {
  it("requires title and message on create and applies defaults", () => {
    expect(validateAvviso({ titolo: "Chiusura" }, "create")).toEqual({
      ok: false,
      error: 'Campo "messaggio" obbligatorio',
    });
    expect(validateAvviso({ titolo: "Chiusura", messaggio: "Lunedì chiuso" }, "create")).toEqual({
      ok: true,
      data: { titolo: "Chiusura", messaggio: "Lunedì chiuso", livello: "info", pubblicato: true },
    });
  });

  it("updates only the fields sent and drops unknown ones", () => {
    expect(
      validateAvviso({ pubblicato: false, id: "x", _id: "y", createdAt: "z" }, "update")
    ).toEqual({
      ok: true,
      data: { pubblicato: false },
    });
  });

  it("rejects unsafe links, bad levels, bad dates and inverted periods", () => {
    const base = { titolo: "T", messaggio: "M" };
    expect(validateAvviso({ ...base, link: "javascript:alert(1)" }, "create").ok).toBe(false);
    expect(validateAvviso({ ...base, livello: "critico" }, "create").ok).toBe(false);
    expect(validateAvviso({ ...base, scadenza: "domani" }, "create").ok).toBe(false);
    expect(
      validateAvviso(
        { ...base, inizio: "2026-10-02T10:00:00Z", scadenza: "2026-10-01T10:00:00Z" },
        "create"
      ).ok
    ).toBe(false);
    expect(validateAvviso({ ...base, titolo: { $ne: null } }, "create").ok).toBe(false);
  });

  it("normalises dates to ISO and lets empty strings clear optional fields", () => {
    const result = validateAvviso(
      { scadenza: "2026-10-01T10:00:00+02:00", link: "", titoloAr: "" },
      "update"
    );
    expect(result).toEqual({
      ok: true,
      data: { scadenza: "2026-10-01T08:00:00.000Z", link: "", titoloAr: "" },
    });
  });
});

describe("filterActiveAvvisi", () => {
  const now = new Date("2026-09-27T12:00:00Z");

  it("shows only published announcements inside their period", () => {
    const result = filterActiveAvvisi(
      [
        avviso({ id: "draft", pubblicato: false }),
        avviso({ id: "expired", scadenza: "2026-09-27T11:59:00.000Z" }),
        avviso({ id: "future", inizio: "2026-09-28T00:00:00.000Z" }),
        avviso({
          id: "live",
          inizio: "2026-09-27T11:00:00.000Z",
          scadenza: "2026-09-28T00:00:00.000Z",
        }),
        avviso({ id: "open" }),
      ],
      now
    );
    expect(result.map((a) => a.id)).toEqual(["live", "open"]);
  });

  it("orders urgent first, then by most recent", () => {
    const result = filterActiveAvvisi(
      [
        avviso({ id: "info-new", createdAt: "2026-09-20T00:00:00.000Z" }),
        avviso({ id: "urgent", livello: "urgente", createdAt: "2026-09-01T00:00:00.000Z" }),
        avviso({ id: "info-old", createdAt: "2026-09-10T00:00:00.000Z" }),
        avviso({ id: "important", livello: "importante" }),
      ],
      now
    );
    expect(result.map((a) => a.id)).toEqual(["urgent", "important", "info-new", "info-old"]);
  });
});

describe("localizeAvviso", () => {
  it("uses the Arabic text when present and falls back to Italian", () => {
    expect(localizeAvviso(avviso({ titoloAr: "عنوان" }), "ar")).toEqual({
      titolo: "عنوان",
      messaggio: "Messaggio",
    });
    expect(localizeAvviso(avviso({ titoloAr: "عنوان" }), "it")).toEqual({
      titolo: "Titolo",
      messaggio: "Messaggio",
    });
  });
});
