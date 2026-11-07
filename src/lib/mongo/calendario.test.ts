import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Db } from "mongodb";
import { FakeDb } from "./testing/fake-db";

let fake = new FakeDb();
vi.mock("./client", () => ({ getDb: vi.fn(async () => fake) }));

import { getDb } from "./client";
import {
  COLLECTIONS,
  applySchemaValidators,
  createFesta,
  getPublishedContent,
  listContenuti,
  listRegole,
  readPublicCalendarConfig,
  resetCalendarioIndexFlag,
  sanitizeText,
  seedCalendario,
  setRegola,
  updateFesta,
  upsertContenuto,
  validateContenuto,
  validateFesta,
  validateImpostazioni,
  validateRegola,
} from "./calendario";
import { DEFAULT_FIXED_FEASTS } from "@/lib/calendario/rules";

beforeEach(() => {
  fake = new FakeDb();
  resetCalendarioIndexFlag();
  vi.mocked(getDb).mockImplementation(async () => fake as unknown as Db);
});

describe("validazione e sanificazione", () => {
  it("accetta un contenuto valido e scarta campi sconosciuti", () => {
    const r = validateContenuto({
      livello: "fixed",
      chiave: "04-27",
      stato: "pubblicato",
      sinassario: { it: "  Martirio di …  ", ar: "", xx: "ignorato" },
      letture: { vangelo: { it: "Gv 1,1-17" }, sconosciuta: { it: "no" } },
      _id: "x",
      updatedBy: "intruso",
    });
    expect(r).toEqual({
      ok: true,
      data: {
        livello: "fixed",
        chiave: "04-27",
        stato: "pubblicato",
        sinassario: { it: "Martirio di …" },
        letture: { vangelo: { it: "Gv 1,1-17" } },
      },
    });
  });

  it("rifiuta livelli, chiavi, stati e testi non validi", () => {
    const base = { livello: "fixed", chiave: "04-27" };
    expect(validateContenuto({ ...base, livello: "altro" }).ok).toBe(false);
    expect(validateContenuto({ ...base, chiave: "14-01" }).ok).toBe(false);
    expect(validateContenuto({ ...base, chiave: "13-07" }).ok).toBe(false);
    expect(validateContenuto({ livello: "movable", chiave: "E+12" }).ok).toBe(true);
    expect(validateContenuto({ livello: "movable", chiave: "E+0012" }).ok).toBe(false);
    expect(validateContenuto({ livello: "seasonal", chiave: "04-S2-0" }).ok).toBe(true);
    expect(validateContenuto({ ...base, chiave: { $ne: null } }).ok).toBe(false);
    expect(validateContenuto({ ...base, stato: "visibile" }).ok).toBe(false);
    expect(validateContenuto({ ...base, sinassario: { it: { $gt: "" } } }).ok).toBe(false);
    expect(validateContenuto({ ...base, note: { it: "x".repeat(6000) } }).ok).toBe(false);
    expect(validateContenuto([]).ok).toBe(false);
  });

  it("toglie i caratteri di controllo e normalizza gli a capo", () => {
    expect(sanitizeText("riga 1\r\nriga\u0007 2\u0000", 100)).toBe("riga 1\nriga 2");
    expect(sanitizeText("   ", 100)).toBeUndefined();
    expect(sanitizeText(42, 100)).toBeNull();
  });

  it("valida le feste fisse", () => {
    const ok = validateFesta(
      { id: "san-marco", mese: 8, giorno: 30, nome: { it: "San Marco" } },
      "create"
    );
    expect(ok).toEqual({
      ok: true,
      data: { id: "san-marco", mese: 8, giorno: 30, nome: { it: "San Marco" }, attiva: true },
    });
    expect(validateFesta({ id: "x y", mese: 1, giorno: 1, nome: { it: "a" } }, "create").ok).toBe(
      false
    );
    expect(validateFesta({ id: "nasi", mese: 13, giorno: 7, nome: { it: "a" } }, "create").ok).toBe(
      false
    );
    expect(
      validateFesta({ id: "natale", mese: 4, giorno: 29, nome: { it: "N" } }, "create").ok
    ).toBe(false);
    expect(validateFesta({ attiva: false }, "update")).toEqual({
      ok: true,
      data: { attiva: false },
    });
  });

  it("una regola incerta non si attiva senza un valore ammesso", () => {
    expect(validateRegola({ id: "natale", attiva: true, valore: null }).ok).toBe(false);
    expect(validateRegola({ id: "natale", attiva: true, valore: "25-dicembre" }).ok).toBe(false);
    expect(validateRegola({ id: "natale", attiva: true, valore: "29-koiak" }).ok).toBe(true);
    expect(validateRegola({ id: "natale", attiva: false, valore: null }).ok).toBe(true);
    expect(validateRegola({ id: "inventata", attiva: false }).ok).toBe(false);
    // predisposta ma non implementata: non attivabile
    expect(
      validateRegola({ id: "mercolediVenerdi", attiva: true, valore: "esclusa-cinquantina" }).ok
    ).toBe(false);
  });

  it("valida la località predefinita", () => {
    expect(validateImpostazioni({ localita: { name: "Roma", lat: 41.9, lon: 12.5 } }).ok).toBe(
      true
    );
    expect(validateImpostazioni({ localita: { name: "X", lat: 91, lon: 0 } }).ok).toBe(false);
    expect(validateImpostazioni({ localita: { name: "", lat: 0, lon: 0 } }).ok).toBe(false);
    expect(validateImpostazioni({ localita: { name: "X", lat: "45", lon: 9 } }).ok).toBe(false);
  });
});

describe("contenuti", () => {
  it("la lettura pubblica restituisce solo i contenuti pubblicati, senza audit", async () => {
    await upsertContenuto(
      { livello: "fixed", chiave: "04-27", stato: "bozza", sinassario: { it: "Bozza" } },
      "admin1"
    );
    expect(await getPublishedContent("fixed", "04-27")).toBeNull();

    await upsertContenuto(
      { livello: "fixed", chiave: "04-27", stato: "pubblicato", sinassario: { it: "Testo" } },
      "admin1"
    );
    expect(await getPublishedContent("fixed", "04-27")).toEqual({
      level: "fixed",
      key: "04-27",
      sinassario: { it: "Testo" },
    });
  });

  it("salva per chiave senza duplicati, con campi di audit", async () => {
    const first = await upsertContenuto(
      { livello: "movable", chiave: "E-48", stato: "bozza" },
      "admin1"
    );
    const second = await upsertContenuto(
      { livello: "movable", chiave: "E-48", stato: "pubblicato", note: { it: "Nota" } },
      "admin2"
    );
    expect(await fake.collection(COLLECTIONS.contenuti).countDocuments()).toBe(1);
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.updatedBy).toBe("admin2");
    expect(second.note).toEqual({ it: "Nota" });
    expect(await listContenuti({ chiavi: ["E-48"] })).toHaveLength(1);
  });

  it("non legge chiavi non valide", async () => {
    expect(await getPublishedContent("fixed", "{$ne:1}")).toBeNull();
  });
});

describe("seed idempotente", () => {
  it("inserisce feste, regole, impostazioni e sezione una sola volta", async () => {
    const db = fake as unknown as Db;
    const first = await seedCalendario(db);
    expect(first.inserted[COLLECTIONS.feste]).toBe(DEFAULT_FIXED_FEASTS.length);
    expect(first.inserted.section_visibility).toBe(1);

    const second = await seedCalendario(db);
    expect(Object.values(second.inserted).every((n) => n === 0)).toBe(true);
    expect(await fake.collection(COLLECTIONS.feste).countDocuments()).toBe(6);
    expect(await fake.collection("section_visibility").countDocuments()).toBe(1);
  });

  it("non sovrascrive le modifiche dell'admin", async () => {
    const db = fake as unknown as Db;
    await seedCalendario(db);
    await updateFesta("croce", { attiva: false, nome: { it: "Croce (modificata)" } }, "admin1");
    await setRegola({ id: "natale", attiva: true, valore: "29-koiak" }, "admin1");
    await fake
      .collection("section_visibility")
      .updateOne({ sectionId: "calendario" }, { $set: { isActive: false } });

    await seedCalendario(db);

    const croce = await fake.collection(COLLECTIONS.feste).findOne({ id: "croce" });
    expect(croce).toMatchObject({ attiva: false, nome: { it: "Croce (modificata)" } });
    const natale = (await listRegole()).find((r) => r.id === "natale");
    expect(natale).toMatchObject({ attiva: true, valore: "29-koiak", updatedBy: "admin1" });
    expect(
      await fake.collection("section_visibility").findOne({ sectionId: "calendario" })
    ).toMatchObject({ isActive: false });
  });

  it("le regole incerte partono disattivate", async () => {
    await seedCalendario(fake as unknown as Db);
    expect((await listRegole()).every((r) => !r.attiva && r.valore === null)).toBe(true);
  });

  it("applica i validatori di schema alle collezioni", async () => {
    await applySchemaValidators(fake as unknown as Db);
    expect(fake.commands).toHaveLength(4);
  });
});

describe("configurazione pubblica", () => {
  it("senza seed usa le feste predefinite; dopo il seed solo quelle attive", async () => {
    expect((await readPublicCalendarConfig()).feasts).toHaveLength(6);
    await seedCalendario(fake as unknown as Db);
    await updateFesta("croce", { attiva: false }, "admin1");
    await createFesta(
      { id: "san-marco", mese: 8, giorno: 30, nome: { it: "San Marco" }, attiva: true },
      "admin1"
    );
    const config = await readPublicCalendarConfig();
    expect(config.feasts.map((f) => f.id)).not.toContain("croce");
    expect(config.feasts.map((f) => f.id)).toContain("san-marco");
    expect(config.location.name).toBe("Milano");
  });

  it("non crea feste con identificativo duplicato", async () => {
    await seedCalendario(fake as unknown as Db);
    const dup = await createFesta(
      { id: "croce", mese: 1, giorno: 17, nome: { it: "Doppione" }, attiva: true },
      "admin1"
    );
    expect(dup).toBeNull();
  });
});
