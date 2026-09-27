import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({
  validateUserSession: vi.fn(),
  deleteAllUserSessions: vi.fn(async () => "2026-09-26T10:00:00.000Z"),
  createUserSession: vi.fn(async () => ({
    token: "new-session-token",
    expiresAt: new Date(Date.now() + 1000),
  })),
}));
vi.mock("@/lib/auth/jwt", () => ({
  verifyJwt: vi.fn(async () => ({ sub: "u1", iat: 0, exp: 7 * 24 * 60 * 60 })),
}));
vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
  findUserByUsername: vi.fn(),
  updateUserPassword: vi.fn(),
}));
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock("@/lib/auth/session", () => ({
  validateSession: vi.fn(),
  reissueAdminSessionCookie: vi.fn(),
}));
vi.mock("@/lib/mongo/admin-password-changes", () => ({
  markAdminPasswordChangedByUsername: vi.fn(),
}));

import { POST } from "./route";
import { cookies } from "next/headers";
import {
  validateUserSession,
  deleteAllUserSessions,
  createUserSession,
} from "@/lib/mongo/sessions";
import { findUserByIdFull, updateUserPassword } from "@/lib/mongo/users";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { supabaseAdmin } from "@/lib/supabase/server";
import { markAdminPasswordChangedByUsername } from "@/lib/mongo/admin-password-changes";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/change-password", () => {
  const cookieSet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) => (name === "user_session" ? { value: "tok" } : undefined),
      set: cookieSet,
    });
  });

  it("invalidates all other sessions after a successful password change", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      username: "mario",
      passwordHash: "hash",
      adminRequest: "none",
    });
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue("newhash");
    (updateUserPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await POST(
      mockRequest({ currentPassword: "Old12345!", newPassword: "New12345!" })
    );
    const json = await res.json();

    expect(json).toEqual({ success: true });
    expect(deleteAllUserSessions).toHaveBeenCalledWith("u1");
  });

  it("keeps the caller signed in by re-issuing their session bound to the new passwordChangedAt", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      username: "mario",
      passwordHash: "hash",
      adminRequest: "none",
    });
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue("newhash");

    await POST(mockRequest({ currentPassword: "Old12345!", newPassword: "New12345!" }));

    // Il token originale durava 7 giorni: la sessione riemessa resta "ricordami".
    expect(createUserSession).toHaveBeenCalledWith("u1", expect.any(Request), true, {
      passwordChangedAt: "2026-09-26T10:00:00.000Z",
    });
    expect(cookieSet).toHaveBeenCalledWith(
      "user_session",
      "new-session-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" })
    );
  });

  it("does not re-issue a session when the current password is wrong", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      username: "mario",
      passwordHash: "hash",
      adminRequest: "none",
    });
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await POST(mockRequest({ currentPassword: "Wrong123!", newPassword: "New12345!" }));

    expect(res.status).toBe(403);
    expect(deleteAllUserSessions).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("closes the other admin sessions of an admin linked to the user", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "u1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "u1",
      username: "mario",
      passwordHash: "old",
      adminRequest: "approved",
    });
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue("newhash");
    (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      update: () => ({ eq: async () => ({ error: null }) }),
    });

    const res = await POST(mockRequest({ currentPassword: "Old123!x", newPassword: "New123!x" }));

    expect(res.status).toBe(200);
    expect(markAdminPasswordChangedByUsername).toHaveBeenCalledWith("mario");
  });
});
