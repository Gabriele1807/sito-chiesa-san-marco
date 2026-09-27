import { describe, it, expect, vi, beforeEach } from "vitest";

const getEventi = vi.fn();
vi.mock("@/lib/mongo/content", () => ({ getEventi: () => getEventi() }));

const getIscrizioniWithoutReminder = vi.fn();
const claimIscrizioneReminder = vi.fn();
const releaseIscrizioneReminder = vi.fn<(id: string) => Promise<void>>(async () => undefined);
vi.mock("@/lib/mongo/registrations", () => ({
  getIscrizioniWithoutReminder: (id: string) => getIscrizioniWithoutReminder(id),
  claimIscrizioneReminder: (id: string) => claimIscrizioneReminder(id),
  releaseIscrizioneReminder: (id: string) => releaseIscrizioneReminder(id),
}));

const sendRegistrationReminder = vi.fn();
vi.mock("./registration-emails", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./registration-emails")>()),
  sendRegistrationReminder: (...args: unknown[]) => sendRegistrationReminder(...args),
}));
vi.mock("@/lib/email/send-email", () => ({}));

import { tomorrowInRome, runEventReminders } from "./reminders";

describe("tomorrowInRome", () => {
  it("uses the Milan calendar day, not the UTC one", () => {
    // 23:30 UTC del 28 marzo 2026 = 00:30 del 29 a Milano (inizio ora legale): domani è il 30.
    expect(tomorrowInRome(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-30");
    expect(tomorrowInRome(new Date("2026-09-27T16:00:00Z"))).toBe("2026-09-28");
    expect(tomorrowInRome(new Date("2026-12-31T16:00:00Z"))).toBe("2027-01-01");
  });
});

describe("runEventReminders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reminds only tomorrow's registrations, once, and retries failed sends later", async () => {
    getEventi.mockResolvedValue([
      { id: "tomorrow", titolo: "Ritiro", data: "2026-09-28T10:00" },
      { id: "later", titolo: "Festa", data: "2026-10-05T10:00" },
    ]);
    getIscrizioniWithoutReminder.mockResolvedValue([
      { _id: "ok", createdByEmail: "a@example.com" },
      { _id: "no-email" },
      { _id: "taken", email: "b@example.com" },
      { _id: "fails", email: "c@example.com" },
    ]);
    claimIscrizioneReminder.mockImplementation(async (id: string) => id !== "taken");
    sendRegistrationReminder.mockImplementation(
      async (_evento: unknown, iscrizione: { _id: string }) =>
        iscrizione._id === "fails" ? { ok: false, error: "send_failed" } : { ok: true }
    );

    const result = await runEventReminders(new Date("2026-09-27T16:00:00Z"));

    expect(result).toEqual({ date: "2026-09-28", events: 1, sent: 1, failed: 1, withoutEmail: 1 });
    expect(getIscrizioniWithoutReminder).toHaveBeenCalledWith("tomorrow");
    expect(getIscrizioniWithoutReminder).not.toHaveBeenCalledWith("later");
    expect(sendRegistrationReminder).toHaveBeenCalledTimes(2);
    expect(releaseIscrizioneReminder).toHaveBeenCalledWith("fails");
    expect(releaseIscrizioneReminder).toHaveBeenCalledTimes(1);
  });
});
