import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireAdminSession: vi.fn(async () => ({ id: "a1", ruolo: "admin" })),
}));
vi.mock("@/lib/auth/permissions", () => ({ hasPermission: () => true }));
vi.mock("@/lib/mongo/content", () => ({
  getEventoById: vi.fn(async () => ({
    id: "e1",
    titolo: "Ritiro dei giovani – خلوة الشباب",
    data: "2026-10-10T09:00:00.000Z",
    luogo: "Milano",
    postiDisponibili: 50,
  })),
}));
vi.mock("@/lib/mongo/registrations", () => ({
  getIscrizioniByEvento: vi.fn(async () => [
    {
      eventoId: "e1",
      nome: "Mario",
      cognome: "Rossi",
      padreNome: "Luigi",
      padreCognome: "Rossi",
      telefono: "333",
      ha_pagato: true,
      createdAt: "2026-09-20T10:00:00.000Z",
    },
    {
      eventoId: "e1",
      nome: "مينا",
      cognome: "جرجس",
      padreNome: "Ğirgis",
      padreCognome: "Ⲙⲏⲛⲁ",
      telefono: "334",
      note: "🙏",
      ha_pagato: false,
      createdAt: "2026-09-21T10:00:00.000Z",
    },
  ]),
}));
vi.mock("@/lib/mongo/operation-retry", () => ({
  withDbRetry: (fn: () => unknown) => fn(),
  getErrorMessage: (e: unknown) => String(e),
  isConnectionError: () => false,
}));

import { GET } from "./route";

describe("GET /api/admin/iscrizioni/export", () => {
  it("produces a PDF even when registrations contain Arabic, Coptic, emoji or non-WinAnsi letters", async () => {
    const res = await GET(
      new Request("http://localhost/api/admin/iscrizioni/export?eventoId=e1&format=pdf")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });
});
