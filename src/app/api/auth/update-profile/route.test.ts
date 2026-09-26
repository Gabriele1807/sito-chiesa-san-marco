import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
  updateUser: vi.fn(),
  updateUserEmail: vi.fn(async () => ({ success: true })),
  updateUserUsername: vi.fn(),
  updateAdminRequest: vi.fn(),
  findUserByUsername: vi.fn(),
  updateSuperAdminRequest: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/auth/session", () => ({ validateSession: vi.fn() }));

import { POST } from "./route";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull, updateUserEmail } from "@/lib/mongo/users";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/update-profile", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/update-profile (utente normale)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) => (name === "user_session" ? { value: "tok" } : undefined),
    });
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      email: "mario@example.com",
      username: "mario",
      attivo: true,
    });
  });

  it("stores a new email trimmed and lowercased, like register/login/forgot-password expect", async () => {
    const res = await POST(mockRequest({ email: "  Nuovo.Indirizzo@Example.COM " }));

    expect(res.status).toBe(200);
    expect(updateUserEmail).toHaveBeenCalledWith("u1", "nuovo.indirizzo@example.com");
  });

  it("does not touch the email when only its casing differs from the stored one", async () => {
    await POST(mockRequest({ email: "MARIO@example.com" }));
    expect(updateUserEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const res = await POST(mockRequest({ email: "mario@" }));
    expect(res.status).toBe(400);
    expect(updateUserEmail).not.toHaveBeenCalled();
  });
});
