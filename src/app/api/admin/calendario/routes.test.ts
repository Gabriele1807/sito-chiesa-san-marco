import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/client", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/mongo/audit-log", () => ({ logAdminAction: vi.fn() }));
vi.mock("@/lib/cache/content-revalidate", () => ({ revalidatePublicContent: vi.fn() }));
vi.mock("@/lib/mongo/visibility", () => ({ getSectionVisibility: vi.fn(async () => null) }));
vi.mock("@/lib/mongo/calendario", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mongo/calendario")>();
  return {
    ...actual,
    ensureCalendarioSeeded: vi.fn(async () => {}),
    upsertContenuto: vi.fn(async (data: object) => ({ ...data, id: "c1" })),
    deleteContenuto: vi.fn(async () => true),
    listContenuti: vi.fn(async () => []),
    createFesta: vi.fn(async (data: object) => ({ ...data })),
    updateFesta: vi.fn(async (id: string, data: object) => ({ id, nome: { it: "X" }, ...data })),
    deleteFesta: vi.fn(async () => true),
    setRegola: vi.fn(async (data: object) => data),
    listRegole: vi.fn(async () => []),
    setImpostazioni: vi.fn(async (data: object) => data),
    getImpostazioni: vi.fn(async () => null),
  };
});

import { requireAdminSession } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";
import { logAdminAction } from "@/lib/mongo/audit-log";
import * as db from "@/lib/mongo/calendario";
import * as contenuti from "./contenuti/route";
import * as feste from "./feste/route";
import * as regole from "./regole/route";
import * as impostazioni from "./impostazioni/route";

const admin = { id: "a1", username: "marco", nome: "M", cognome: "R", ruolo: "admin" as const };

function req(method: string, body?: unknown, query = "") {
  return new Request(`http://localhost/api/admin/calendario/x${query}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const validContent = { livello: "fixed", chiave: "04-27", stato: "pubblicato", note: { it: "N" } };

describe("API admin del calendario: permessi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("senza sessione admin ogni lettura e scrittura risponde 401 senza toccare il database", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(null);
    const responses = await Promise.all([
      contenuti.GET(req("GET")),
      contenuti.PUT(req("PUT", validContent)),
      contenuti.DELETE(req("DELETE", undefined, "?livello=fixed&chiave=04-27")),
      feste.GET(),
      feste.POST(req("POST", { id: "x1", mese: 1, giorno: 2, nome: { it: "X" } })),
      feste.PUT(req("PUT", { id: "croce", attiva: false })),
      feste.DELETE(req("DELETE", undefined, "?id=croce")),
      regole.GET(),
      regole.PUT(req("PUT", { id: "natale", attiva: true, valore: "29-koiak" })),
      impostazioni.GET(),
      impostazioni.PUT(req("PUT", { localita: { name: "Roma", lat: 41.9, lon: 12.5 } })),
    ]);
    expect(responses.map((r) => r.status)).toEqual(Array(11).fill(401));
    for (const fn of [
      db.upsertContenuto,
      db.deleteContenuto,
      db.createFesta,
      db.updateFesta,
      db.deleteFesta,
      db.setRegola,
      db.setImpostazioni,
      db.listContenuti,
    ]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it("un ruolo senza permessi sul calendario non può scrivere", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ...admin,
      ruolo: "editor" as unknown as "admin",
      email: "",
      attivo: true,
      ultimo_accesso: null,
    });
    const res = await contenuti.PUT(req("PUT", validContent));
    expect(res.status).toBe(401);
    expect(db.upsertContenuto).not.toHaveBeenCalled();
  });
});

describe("API admin del calendario: scritture valide e non valide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue({
      ...admin,
      email: "",
      attivo: true,
      ultimo_accesso: null,
    });
  });

  it("salva un contenuto sanificato, con autore, invalida la cache e registra l'azione", async () => {
    const res = await contenuti.PUT(req("PUT", { ...validContent, _id: "x", updatedBy: "altro" }));
    expect(res.status).toBe(200);
    expect(db.upsertContenuto).toHaveBeenCalledWith(
      { livello: "fixed", chiave: "04-27", stato: "pubblicato", note: { it: "N" } },
      "marco"
    );
    expect(revalidatePublicContent).toHaveBeenCalledWith("calendario");
    expect(logAdminAction).toHaveBeenCalled();
  });

  it("rifiuta body non JSON, chiavi non valide e operatori MongoDB", async () => {
    const bad = new Request("http://localhost/x", { method: "PUT", body: "{non json" });
    expect((await contenuti.PUT(bad)).status).toBe(400);
    expect((await contenuti.PUT(req("PUT", { ...validContent, chiave: { $gt: "" } }))).status).toBe(
      400
    );
    expect(
      (await contenuti.DELETE(req("DELETE", undefined, "?livello=fixed&chiave=99-99"))).status
    ).toBe(400);
    expect((await feste.PUT(req("PUT", { id: { $ne: null }, attiva: false }))).status).toBe(400);
    expect(db.upsertContenuto).not.toHaveBeenCalled();
    expect(db.updateFesta).not.toHaveBeenCalled();
  });

  it("non attiva una regola incerta senza valore", async () => {
    const res = await regole.PUT(req("PUT", { id: "natale", attiva: true }));
    expect(res.status).toBe(400);
    expect(db.setRegola).not.toHaveBeenCalled();
  });

  it("il database irraggiungibile in lettura dà 503, non un errore non gestito", async () => {
    vi.mocked(db.listContenuti).mockRejectedValueOnce(new Error("offline"));
    expect((await contenuti.GET(req("GET"))).status).toBe(503);
  });
});
