import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
  updateUser: vi.fn(),
  updateUserEmail: vi.fn(async () => ({ success: true })),
  updateUserUsername: vi.fn(async () => ({ success: true })),
  updateAdminRequest: vi.fn(),
  findUserByUsername: vi.fn(),
  updateSuperAdminRequest: vi.fn(),
}));
const supabaseUpdate = vi.fn();
const adminRow = { id: "a1", username: "admin.old", email: "admin@example.com", ruolo: "admin" };
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      // lettura admin corrente: .select().eq().eq().single()
      select: () => ({
        eq: () => ({ eq: () => ({ single: async () => ({ data: adminRow }) }) }),
      }),
      // update: .update(payload).eq("id", …) [.select().single()]
      update: (payload: Record<string, string>) => {
        supabaseUpdate(payload);
        const result = { error: null };
        return {
          eq: () => ({
            ...result,
            then: (resolve: (v: typeof result) => void) => resolve(result),
            select: () => ({
              single: async () => ({ data: { ...adminRow, ...payload }, error: null }),
            }),
          }),
        };
      },
    })),
  },
}));
vi.mock("@/lib/auth/session", () => ({ validateSession: vi.fn() }));
vi.mock("@/lib/auth/username", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/username")>("@/lib/auth/username");
  return { ...actual, isUsernameTaken: vi.fn(async () => false), findLinkedAdminId: vi.fn() };
});

import { POST } from "./route";
import { cookies } from "next/headers";
import { validateUserSession } from "@/lib/mongo/sessions";
import {
  findUserByIdFull,
  findUserByUsername,
  updateUserEmail,
  updateUserUsername,
} from "@/lib/mongo/users";
import { validateSession } from "@/lib/auth/session";
import { isUsernameTaken, findLinkedAdminId } from "@/lib/auth/username";

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

  it("renames the user when the new username is free", async () => {
    const res = await POST(mockRequest({ username: "  mario.nuovo " }));

    expect(res.status).toBe(200);
    expect(isUsernameTaken).toHaveBeenCalledWith("mario.nuovo", {
      userId: "u1",
      adminId: undefined,
    });
    expect(updateUserUsername).toHaveBeenCalledWith("u1", "mario.nuovo");
  });

  it("refuses a username already used by another account, before writing anything", async () => {
    (isUsernameTaken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    const res = await POST(mockRequest({ username: "Luigi", email: "nuova@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe("Username già in uso da un altro account");
    expect(updateUserUsername).not.toHaveBeenCalled();
    expect(updateUserEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid username with 400", async () => {
    const res = await POST(mockRequest({ username: "ma rio" }));
    expect(res.status).toBe(400);
    expect(isUsernameTaken).not.toHaveBeenCalled();
  });

  it("renames the linked admin account too when the user was promoted to admin", async () => {
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: "u1",
      email: "mario@example.com",
      username: "mario",
      attivo: true,
      adminRequest: "approved",
    });
    (findLinkedAdminId as ReturnType<typeof vi.fn>).mockResolvedValueOnce("a1");

    const res = await POST(mockRequest({ username: "mario2" }));

    expect(res.status).toBe(200);
    expect(isUsernameTaken).toHaveBeenCalledWith("mario2", { userId: "u1", adminId: "a1" });
    expect(updateUserUsername).toHaveBeenCalledWith("u1", "mario2");
    expect(supabaseUpdate).toHaveBeenCalledWith({ username: "mario2" });
  });
});

describe("POST /api/auth/update-profile (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) => (name === "admin_session" ? { value: "atok" } : undefined),
    });
    (validateSession as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "a1" });
    (findUserByUsername as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      username: "admin.old",
    });
  });

  it("checks uniqueness against users and admins, then renames admin and linked user together", async () => {
    const res = await POST(mockRequest({ username: "admin.new" }));

    expect(res.status).toBe(200);
    expect(isUsernameTaken).toHaveBeenCalledWith("admin.new", { adminId: "a1", userId: "u1" });
    expect(supabaseUpdate).toHaveBeenCalledWith(expect.objectContaining({ username: "admin.new" }));
    expect(updateUserUsername).toHaveBeenCalledWith("u1", "admin.new");
  });

  it("refuses an admin username already used by a normal user", async () => {
    (isUsernameTaken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    const res = await POST(mockRequest({ username: "mario" }));

    expect(res.status).toBe(409);
    expect(supabaseUpdate).not.toHaveBeenCalled();
    expect(updateUserUsername).not.toHaveBeenCalled();
  });
});
