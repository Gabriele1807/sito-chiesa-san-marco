import { describe, it, expect, vi, beforeEach } from "vitest";

const consumeActionLimit = vi.fn<
  (...args: unknown[]) => Promise<{ allowed: boolean; retryAfterSeconds: number }>
>(async () => ({ allowed: true, retryAfterSeconds: 0 }));
vi.mock("@/lib/auth/action-limit", () => ({
  LIMITS: { register: {}, prayerRequest: {}, pushSubscribe: {}, eventRegistration: {} },
  consumeActionLimit: (...args: unknown[]) => consumeActionLimit(...args),
}));
vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn(async () => false),
  recordIpRequest: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  createIscrizione: vi.fn(async () => ({
    success: true,
    iscrizione: {
      _id: "r1",
      eventoId: "e1",
      nome: "Mario",
      cognome: "Rossi",
      createdByEmail: "mario@example.com",
    },
  })),
  getEventoById: vi.fn(async () => ({ id: "e1", titolo: "Ritiro", data: "2026-10-04T09:30" })),
}));
const afterCallbacks: (() => Promise<void>)[] = [];
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (fn: () => Promise<void>) => afterCallbacks.push(fn),
}));
const sendRegistrationConfirmation = vi.fn(async () => ({ ok: true }));
vi.mock("@/lib/events/registration-emails", () => ({
  sendRegistrationConfirmation: (...args: unknown[]) =>
    sendRegistrationConfirmation(...(args as [])),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({ findUserById: vi.fn(), findUserByUsername: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ validateSession: vi.fn() }));

import { POST } from "./route";
import { createIscrizione } from "@/lib/db";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserById } from "@/lib/mongo/users";

const forgedBody = {
  eventoId: "e1",
  nome: "Mario",
  cognome: "Rossi",
  padreNome: "Luigi",
  padreCognome: "Rossi",
  telefono: "333",
  email: "vittima@example.com",
  createdByUserId: "victim-id",
  createdByAccountType: "user",
  createdByEmail: "vittima@example.com",
};

function req(body: unknown) {
  return new Request("http://localhost/api/eventi/iscrizione", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function lastSaved() {
  return (createIscrizione as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
}

describe("POST /api/eventi/iscrizione — proprietà dell'iscrizione", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses registrations without an account, whatever the body says", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({ get: () => undefined });

    const res = await POST(req(forgedBody));

    expect(res.status).toBe(401);
    expect(createIscrizione).not.toHaveBeenCalled();
  });

  it("takes the owner from the session, not from the body", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (n: string) => (n === "user_session" ? { value: "tok" } : undefined),
    });
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserById as ReturnType<typeof vi.fn>).mockResolvedValue({
      nome: "Mario",
      cognome: "Rossi",
      email: "mario@example.com",
    });

    await POST(req(forgedBody));

    const saved = lastSaved();
    expect(saved.createdByUserId).toBe("u1");
    expect(saved.createdByAccountType).toBe("user");
    expect(saved.createdByEmail).toBe("mario@example.com");
  });

  it("sends the confirmation email after the response, in the visitor's language", async () => {
    afterCallbacks.length = 0;
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (n: string) =>
        n === "user_session" ? { value: "tok" } : n === "locale" ? { value: "ar" } : undefined,
    });
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserById as ReturnType<typeof vi.fn>).mockResolvedValue({
      nome: "Mario",
      cognome: "Rossi",
      email: "mario@example.com",
    });

    const res = await POST(req(forgedBody));
    expect(res.status).toBe(201);
    expect(lastSaved().emailLocale).toBe("ar");
    // Nulla inviato prima che la risposta sia partita.
    expect(sendRegistrationConfirmation).not.toHaveBeenCalled();

    await Promise.all(afterCallbacks.map((fn) => fn()));
    expect(sendRegistrationConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e1", titolo: "Ritiro" }),
      expect.objectContaining({ _id: "r1", createdByEmail: "mario@example.com" })
    );
  });

  it("limits registrations per account", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (n: string) => (n === "user_session" ? { value: "tok" } : undefined),
    });
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserById as ReturnType<typeof vi.fn>).mockResolvedValue({
      nome: "Mario",
      cognome: "Rossi",
      email: "mario@example.com",
    });
    consumeActionLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 });

    const res = await POST(req(forgedBody));
    expect(res.status).toBe(429);
    expect(createIscrizione).not.toHaveBeenCalled();
  });
});
