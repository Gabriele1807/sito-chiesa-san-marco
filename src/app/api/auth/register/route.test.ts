import { describe, it, expect, vi, beforeEach } from "vitest";

const afterCallbacks: (() => Promise<void>)[] = [];
const consumeActionLimit = vi.fn<(...args: unknown[]) => Promise<{ allowed: boolean; retryAfterSeconds: number }>>(async () => ({ allowed: true, retryAfterSeconds: 0 }));
vi.mock("@/lib/auth/action-limit", () => ({
  LIMITS: { register: {}, prayerRequest: {}, pushSubscribe: {}, eventRegistration: {} },
  consumeActionLimit: (...args: unknown[]) => consumeActionLimit(...args),
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (fn: () => Promise<void>) => afterCallbacks.push(fn),
}));
const startEmailVerification = vi.fn<(...args: unknown[]) => Promise<{ ok: boolean }>>(async () => ({ ok: true }));
vi.mock("@/lib/auth/email-verification", () => ({
  startEmailVerification: (...args: unknown[]) => startEmailVerification(...args),
  localeFromRequest: () => "it",
}));
vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn(async () => false),
  recordIpRequest: vi.fn(),
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "hash") }));
vi.mock("@/lib/mongo/users", () => ({
  createUser: vi.fn(async () => ({ _id: "u1", email: "mario@example.com" })),
  findUserByEmail: vi.fn(async () => null),
}));
vi.mock("@/lib/auth/username", () => ({ isUsernameTaken: vi.fn(async () => false) }));

import { POST } from "./route";
import { createUser } from "@/lib/mongo/users";
import { isUsernameTaken } from "@/lib/auth/username";

const validBody = {
  email: "mario@example.com",
  username: "Mario_1",
  password: "Valid123!",
  nome: "Mario",
  cognome: "Rossi",
  role: "credente",
  ageGroup: "19-29",
};

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register — unicità username", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks the username against users and admins before creating the account", async () => {
    const res = await POST(mockRequest(validBody));
    expect(res.status).toBe(201);
    expect(isUsernameTaken).toHaveBeenCalledWith("Mario_1");
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ username: "Mario_1" }));
    // Link di verifica dell'email programmato dopo la risposta.
    await Promise.all(afterCallbacks.splice(0).map((fn) => fn()));
    expect(startEmailVerification).toHaveBeenCalledWith("u1", "mario@example.com", "it");
  });

  it("refuses a username already used (any casing, user or admin)", async () => {
    (isUsernameTaken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    const res = await POST(mockRequest(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Username già in uso");
    expect(createUser).not.toHaveBeenCalled();
  });
});
