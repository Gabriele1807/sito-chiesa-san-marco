import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn(async () => false),
  recordIpRequest: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  createIscrizione: vi.fn(async () => ({ success: true, iscrizione: { _id: "r1" } })),
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

  it("ignores createdBy* sent by an anonymous client", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({ get: () => undefined });

    await POST(req(forgedBody));

    const saved = lastSaved();
    expect(saved.createdByUserId).toBeUndefined();
    expect(saved.createdByAccountType).toBeUndefined();
    expect(saved.createdByEmail).toBeUndefined();
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
});
