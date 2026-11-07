import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/section-access", () => ({ getSectionAccess: vi.fn(async () => "full") }));
vi.mock("@/lib/mongo/client", () => ({ getDb: vi.fn() }));

import { getDb } from "@/lib/mongo/client";
import { getSectionAccess } from "@/lib/section-access";
import { FakeDb } from "@/lib/mongo/testing/fake-db";
import { GET } from "./route";

const url = (q: string) => new Request(`http://localhost/api/calendario/giorno?${q}`);
const VALID = "fixed=04-27&movable=E-105&seasonal=04-S4-0";

describe("GET /api/calendario/giorno", () => {
  let fake: FakeDb;

  beforeEach(async () => {
    vi.clearAllMocks();
    fake = new FakeDb();
    vi.mocked(getDb).mockImplementation(async () => fake as never);
    const c = fake.collection("calendario_contenuti");
    await c.insertOne({
      livello: "fixed",
      chiave: "04-27",
      stato: "pubblicato",
      sinassario: { it: "Pubblicato" },
      updatedBy: "marco",
    });
    await c.insertOne({
      livello: "movable",
      chiave: "E-105",
      stato: "bozza",
      note: { it: "Bozza segreta" },
    });
  });

  it("restituisce solo i contenuti pubblicati, senza dati di audit", async () => {
    const res = await GET(url(VALID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fixed).toEqual({ level: "fixed", key: "04-27", sinassario: { it: "Pubblicato" } });
    expect(body.movable).toBeNull();
    expect(JSON.stringify(body)).not.toContain("Bozza segreta");
    expect(JSON.stringify(body)).not.toContain("marco");
    expect(body.available).toBe(true);
  });

  it("rifiuta chiavi mancanti o non valide", async () => {
    expect((await GET(url("fixed=04-27"))).status).toBe(400);
    expect((await GET(url("fixed=04-27&movable=E-105&seasonal=x"))).status).toBe(400);
    expect((await GET(url("fixed[$ne]=1&movable=E-1&seasonal=04-S4-0"))).status).toBe(400);
  });

  it("con il database giù risponde 200 e 'nessuna lettura disponibile'", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getDb).mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await GET(url(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      fixed: null,
      movable: null,
      seasonal: null,
      available: false,
    });
  });

  it("rispetta la visibilità della sezione", async () => {
    vi.mocked(getSectionAccess).mockResolvedValueOnce("coming_soon");
    expect((await GET(url(VALID))).status).toBe(403);
  });
});
