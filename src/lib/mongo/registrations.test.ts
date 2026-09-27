import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IscrizioneEvento } from "@/types";

const find = vi.fn();
vi.mock("./client", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: () => ({
      createIndex: vi.fn(),
      find: (query: unknown) => {
        find(query);
        return { sort: () => ({ toArray: async () => [] }) };
      },
    }),
  }),
}));
vi.mock("./content", () => ({ getEventoById: vi.fn() }));

import { getIscrizioniByUser, redactForViewer } from "./registrations";

type Cond = Record<string, { $regex?: string } | unknown>;

function regexesOf(query: { $or: Cond[] }): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.$regex === "string") out.push(o.$regex);
      Object.values(o).forEach(walk);
    }
  };
  walk(query);
  return out;
}

describe("getIscrizioniByUser — nessuna regex controllata dall'utente", () => {
  beforeEach(() => find.mockClear());

  it("treats regex metacharacters in profile names as literal text", async () => {
    await getIscrizioniByUser(".*", ".*");
    const regexes = regexesOf(find.mock.calls[0][0]);

    expect(regexes.length).toBeGreaterThan(0);
    for (const r of regexes) {
      // Il pattern generato deve corrispondere solo alla stringa letterale ".*"
      // (o ".* .*" per il nome completo), mai a un nome qualunque.
      const re = new RegExp(r, "i");
      expect(re.test("Mario")).toBe(false);
      expect(re.test("Rossi")).toBe(false);
    }
    expect(new RegExp(regexes[0], "i").test(".*")).toBe(true);
  });

  it("includes the account-ownership condition when an owner is given", async () => {
    await getIscrizioniByUser("Mario", "Rossi", undefined, { id: "u1", accountType: "user" });
    expect(find.mock.calls[0][0].$or).toContainEqual({
      createdByUserId: "u1",
      createdByAccountType: "user",
    });
  });
});

describe("redactForViewer", () => {
  const base: IscrizioneEvento = {
    eventoId: "e1",
    nome: "Mario",
    cognome: "Rossi",
    padreNome: "Luigi",
    padreCognome: "Rossi",
    telefono: "333111",
    email: "mario@example.com",
    note: "allergie",
    ha_pagato: false,
  };
  const owner = { id: "u1", accountType: "user" as const };

  it("keeps contact data on registrations created by the viewer's account", () => {
    const [r] = redactForViewer(
      [{ ...base, createdByUserId: "u1", createdByAccountType: "user" }],
      owner
    );
    expect(r.telefono).toBe("333111");
    expect(r.note).toBe("allergie");
  });

  it("hides contact data on registrations only matched by name/email", () => {
    const [r] = redactForViewer(
      [
        {
          ...base,
          createdByUserId: "other",
          createdByAccountType: "user",
          createdByEmail: "x@y.it",
        },
      ],
      owner,
      "mario@example.com"
    );
    expect(r.telefono).toBe("");
    expect(r.email).toBeUndefined();
    expect(r.note).toBeUndefined();
    expect(r.createdByEmail).toBeUndefined();
    expect(r.nome).toBe("Mario");
  });

  it("does not treat an admin id as the same account as a user id", () => {
    const [r] = redactForViewer(
      [{ ...base, createdByUserId: "u1", createdByAccountType: "admin" }],
      owner
    );
    expect(r.telefono).toBe("");
  });

  it("uses the creator email only for legacy registrations without an owner id", () => {
    const legacy = { ...base, createdByEmail: "Mario@Example.com" };
    expect(redactForViewer([legacy], owner, "mario@example.com")[0].telefono).toBe("333111");
    expect(redactForViewer([legacy], owner, "altro@example.com")[0].telefono).toBe("");
  });
});
