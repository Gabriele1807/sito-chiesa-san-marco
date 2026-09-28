import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const runEventReminders = vi.fn(async () => ({
  date: "2026-09-28",
  events: 0,
  sent: 0,
  failed: 0,
  withoutEmail: 0,
}));
vi.mock("@/lib/events/reminders", () => ({ runEventReminders: () => runEventReminders() }));
const archiveStalePrayerRequests = vi.fn(async () => 3);
vi.mock("@/lib/mongo/prayer-requests", () => ({
  archiveStalePrayerRequests: () => archiveStalePrayerRequests(),
}));

import { GET } from "./route";

const call = (authorization?: string) =>
  GET(
    new Request("http://localhost/api/cron/event-reminders", {
      headers: authorization ? { authorization } : {},
    })
  );

describe("GET /api/cron/event-reminders", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("does nothing when CRON_SECRET is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await call("Bearer anything")).status).toBe(503);
    expect(runEventReminders).not.toHaveBeenCalled();
    expect(archiveStalePrayerRequests).not.toHaveBeenCalled();
  });

  it("rejects calls without the right secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect(runEventReminders).not.toHaveBeenCalled();
  });

  it("runs the reminders for Vercel Cron", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await call("Bearer s3cret-value");
    expect(res.status).toBe(200);
    expect(runEventReminders).toHaveBeenCalledTimes(1);
    expect(archiveStalePrayerRequests).toHaveBeenCalledTimes(1);
    expect(await res.json()).toMatchObject({ prayerArchived: 3 });
  });
});
