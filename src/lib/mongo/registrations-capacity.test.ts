import { describe, it, expect, vi, beforeEach } from "vitest";

// Iscrizioni "nel database" dell'evento e persone che occupano.
let stored: { _id: string; people: number }[] = [];
let extraAfterInsert = 0; // simula un'iscrizione concorrente arrivata tra controllo e inserimento
const deleteOne = vi.fn();

vi.mock("./client", () => ({
  getDb: async () => ({
    collection: () => ({
      createIndex: vi.fn(),
      findOne: async () => null,
      countDocuments: async () => 0,
      aggregate: () => ({
        toArray: async () => [{ _id: null, total: stored.reduce((sum, r) => sum + r.people, 0) }],
      }),
      insertOne: async (doc: { registrationType: string; familyMembers: unknown[] }) => {
        const people = doc.registrationType === "family" ? doc.familyMembers.length : 1;
        stored.push({ _id: "new", people: people + extraAfterInsert });
        return { insertedId: "new" };
      },
      deleteOne: async (filter: { _id: string }) => {
        deleteOne(filter);
        stored = stored.filter((r) => r._id !== filter._id);
      },
    }),
  }),
}));
vi.mock("./content", () => ({
  getEventoById: async () => ({
    id: "e1",
    titolo: "Ritiro",
    data: "2026-10-04T09:30",
    postiDisponibili: 10,
  }),
}));

import { createIscrizione } from "./registrations";

const single = {
  eventoId: "e1",
  nome: "Luca",
  cognome: "Bianchi",
  padreNome: "Paolo",
  padreCognome: "Bianchi",
  telefono: "3331234567",
};
const family = (n: number) => ({
  ...single,
  registrationType: "family" as const,
  familyMembers: [
    { role: "padre" as const, fullName: "Paolo Bianchi" },
    ...Array.from({ length: n - 1 }, (_, i) => ({
      role: "figlio" as const,
      fullName: `Figlio ${i} Bianchi`,
    })),
  ],
});

describe("createIscrizione — posti disponibili e limiti", () => {
  beforeEach(() => {
    stored = [];
    extraAfterInsert = 0;
    deleteOne.mockClear();
  });

  it("counts the people of the new registration: a family of 6 does not fit in 1 free seat", async () => {
    stored = [{ _id: "old", people: 9 }];
    expect(await createIscrizione(family(6))).toMatchObject({ success: false, errorCode: "full" });
    expect(await createIscrizione(single)).toMatchObject({ success: true });
  });

  it("undoes its own registration when a concurrent one filled the event meanwhile", async () => {
    stored = [{ _id: "old", people: 9 }];
    extraAfterInsert = 1; // un'altra persona si è iscritta nello stesso istante
    expect(await createIscrizione(single)).toMatchObject({ success: false, errorCode: "full" });
    expect(deleteOne).toHaveBeenCalledWith({ _id: "new" });
  });

  it("rejects oversized families and overly long fields", async () => {
    expect(await createIscrizione(family(21))).toMatchObject({
      success: false,
      errorCode: "validation",
    });
    expect(await createIscrizione({ ...single, nome: "x".repeat(101) })).toMatchObject({
      success: false,
      errorCode: "validation",
    });
    expect(await createIscrizione({ ...single, note: "x".repeat(1001) })).toMatchObject({
      success: false,
      errorCode: "validation",
    });
    expect(
      await createIscrizione({ ...single, eventoId: { $ne: null } as unknown as string })
    ).toMatchObject({
      success: false,
      errorCode: "validation",
    });
  });
});
