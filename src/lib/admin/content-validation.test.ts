import { describe, it, expect } from "vitest";
import { validateContent, isSafeUrl, parseContentId } from "./content-validation";

describe("validateContent", () => {
  it("keeps only whitelisted fields (no mass assignment)", () => {
    const r = validateContent(
      "preghiere",
      {
        titolo: "Padre nostro",
        categoria: "Base",
        _id: "x",
        id: "99",
        $where: "1",
        ruolo: "superadmin",
      },
      "create"
    );
    expect(r).toEqual({ ok: true, data: { titolo: "Padre nostro", categoria: "Base" } });
  });

  it("requires mandatory fields on create but not on update", () => {
    expect(validateContent("eventi", { titolo: "Festa" }, "create").ok).toBe(false);
    expect(validateContent("eventi", { titolo: "Festa" }, "update").ok).toBe(true);
    expect(validateContent("eventi", { titolo: "  ", data: "2026-01-01" }, "create").ok).toBe(
      false
    );
  });

  it("rejects wrong types, including MongoDB operator objects", () => {
    expect(validateContent("eventi", { titolo: { $gt: "" } }, "update").ok).toBe(false);
    expect(validateContent("eventi", { postiDisponibili: "10" }, "update").ok).toBe(false);
    expect(validateContent("eventi", { postiDisponibili: -1 }, "update").ok).toBe(false);
    expect(validateContent("icone", { immagini: "a.jpg" }, "update").ok).toBe(false);
    expect(
      validateContent("eventi", { raccoglimento: [{ label: 1, orario: "9" }] }, "update").ok
    ).toBe(false);
    expect(validateContent("eventi", "not an object", "create").ok).toBe(false);
    expect(validateContent("eventi", [], "create").ok).toBe(false);
  });

  it("rejects over-long strings", () => {
    expect(validateContent("preghiere", { titolo: "a".repeat(301) }, "update").ok).toBe(false);
  });

  it("rejects dangerous URL schemes in link/iframe/image fields", () => {
    expect(
      validateContent("video-corsi", { titolo: "V", urlVideo: "javascript:alert(1)" }, "create").ok
    ).toBe(false);
    expect(validateContent("libreria", { urlPDF: "data:text/html,<script>" }, "update").ok).toBe(
      false
    );
    expect(validateContent("icone", { immagini: ["/ok.jpg", "javascript:x"] }, "update").ok).toBe(
      false
    );
    expect(
      validateContent(
        "video-corsi",
        { titolo: "V", urlVideo: "https://www.youtube.com/embed/abc" },
        "create"
      ).ok
    ).toBe(true);
  });

  it("accepts the payloads sent by the admin UI", () => {
    const evento = validateContent(
      "eventi",
      {
        slug: "festa",
        titolo: "Festa",
        data: "2026-05-01T10:00",
        dataFine: "",
        descrizione: "",
        luogo: "Chiesa",
        immagine: "",
        showRaccoglimento: true,
        raccoglimento: [{ label: "Chiesa", orario: "08:00" }],
      },
      "create"
    );
    expect(evento.ok).toBe(true);

    const orario = validateContent(
      "orari",
      { giorno: "Lunedì", celebrazioni: [{ tipo: "", orario: "" }] },
      "create"
    );
    expect(orario).toEqual({
      ok: true,
      data: { giorno: "Lunedì", celebrazioni: [{ tipo: "", orario: "" }] },
    });
  });

  it("treats a null number as 'not set'", () => {
    expect(validateContent("eventi", { postiDisponibili: null }, "update")).toEqual({
      ok: true,
      data: {},
    });
  });
});

describe("isSafeUrl", () => {
  it.each([
    ["", true],
    ["/immagini/a.jpg", true],
    ["https://example.com/a.pdf", true],
    ["http://example.com", true],
    ["//evil.example", false],
    ["/\\evil.example", false],
    ["javascript:alert(1)", false],
    ["JavaScript:alert(1)", false],
    ["vbscript:x", false],
    ["relative/path", false],
  ])("%s → %s", (url, expected) => {
    expect(isSafeUrl(url)).toBe(expected);
  });
});

describe("parseContentId", () => {
  it("accepts plain strings and rejects objects/empty values", () => {
    expect(parseContentId("12")).toBe("12");
    expect(parseContentId({ $ne: null })).toBeNull();
    expect(parseContentId("")).toBeNull();
    expect(parseContentId(12)).toBeNull();
    expect(parseContentId(undefined)).toBeNull();
  });
});
