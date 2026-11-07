import { describe, it, expect, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/mongo/client", () => ({
  getDb: vi.fn(async () => {
    throw new Error("MongoServerSelectionError: ECONNREFUSED");
  }),
}));

import { getCalendarConfigSafe, getDayContentSafe } from "./calendario-data";
import { DEFAULT_PUBLIC_CONFIG } from "@/lib/mongo/calendario";

const keys = { fixed: "04-27", movable: "E-105", seasonal: "04-S4-0" };

describe("database non raggiungibile", () => {
  it("la configurazione ripiega sui valori predefiniti senza lanciare errori", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await getCalendarConfigSafe();
    expect(result).toEqual({ data: DEFAULT_PUBLIC_CONFIG, fallback: true });
  });

  it("i contenuti risultano 'non disponibili' senza lanciare errori", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await getDayContentSafe(keys);
    expect(result.fallback).toBe(true);
    expect(result.data).toEqual({ fixed: null, movable: null, seasonal: null, available: false });
  });

  it("un database lento viene interrotto dal timeout", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const pending = getCalendarConfigSafe(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(2000);
    expect((await pending).fallback).toBe(true);
    vi.useRealTimers();
  });
});
