import { describe, it, expect, vi } from "vitest";

const userFacets = {
  totale: [{ n: 5 }],
  recenti: [{ n: 2 }],
  verificate: [{ n: 3 }],
  perMese: [
    { _id: "2026-09", n: 2 },
    { _id: "2025-12", n: 1 },
  ],
  perFascia: [{ _id: "19-29", n: 4 }],
  perRuolo: [{ _id: "credente", n: 5 }],
};
const perEvent = [
  { _id: "future", iscrizioni: 3, persone: 7, pagate: 1 },
  { _id: "old", iscrizioni: 1, persone: 1, pagate: 1 },
];

vi.mock("@/lib/mongo/client", () => ({
  getDb: async () => ({
    collection: (name: string) => ({
      aggregate: () => ({ toArray: async () => (name === "users" ? [userFacets] : perEvent) }),
    }),
  }),
}));
vi.mock("@/lib/mongo/content", () => ({
  getEventi: async () => [
    { id: "future", titolo: "Ritiro", data: "2026-10-04T09:30", postiDisponibili: 40 },
    { id: "recent", titolo: "Festa", data: "2026-09-01T10:00" },
    { id: "old", titolo: "Molto vecchio", data: "2025-01-01T10:00" },
  ],
}));
vi.mock("@/lib/mongo/prayer-requests", () => ({
  countPrayerRequestsByState: async () => ({ nuova: 2, letta: 1, archiviata: 0 }),
}));
vi.mock("@/lib/mongo/push-subscriptions", () => ({
  countPushSubscriptions: async () => ({ total: 9, it: 8, ar: 1 }),
}));
vi.mock("@/lib/mongo/announcements", () => ({
  listPublishedAvvisi: async () => [],
  filterActiveAvvisi: () => [{ id: "a" }],
}));

import { getAdminStatistics, lastMonths } from "./statistics";

describe("lastMonths", () => {
  it("returns the last 12 months, oldest first, across year boundaries", () => {
    const months = lastMonths(new Date("2026-02-15T12:00:00Z"));
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2025-03");
    expect(months[11]).toBe("2026-02");
  });
});

describe("getAdminStatistics", () => {
  it("aggregates counts without personal data and fills empty months with zero", async () => {
    const stats = await getAdminStatistics(new Date("2026-09-27T10:00:00Z"));

    expect(stats.utenti).toMatchObject({ totale: 5, ultimi30Giorni: 2, emailVerificate: 3 });
    expect(stats.utenti.perMese).toHaveLength(12);
    expect(stats.utenti.perMese.at(-1)).toEqual({ mese: "2026-09", nuovi: 2 });
    expect(stats.utenti.perMese.find((m) => m.mese === "2026-01")).toEqual({
      mese: "2026-01",
      nuovi: 0,
    });
    expect(stats.utenti.perFasciaEta.find((f) => f.fascia === "19-29")?.utenti).toBe(4);

    // Eventi: futuri + passati entro 90 giorni, in ordine di data; il resto escluso.
    expect(stats.eventi.dettaglio.map((e) => e.id)).toEqual(["recent", "future"]);
    expect(stats.eventi.dettaglio[1]).toMatchObject({
      persone: 7,
      iscrizioni: 3,
      pagate: 1,
      postiDisponibili: 40,
      passato: false,
    });
    expect(stats.eventi.dettaglio[0]).toMatchObject({ persone: 0, passato: true });
    expect(stats.eventi).toMatchObject({ inProgramma: 1, personeIscritteInProgramma: 7 });

    expect(stats.richiestePreghiera.nuova).toBe(2);
    expect(stats.notifiche.dispositivi).toBe(9);
    expect(stats.avvisiAttivi).toBe(1);
    expect(JSON.stringify(stats)).not.toMatch(/@|telefono|email"/);
  });
});
