import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({
  validateUserSession: vi.fn(),
  deleteAllUserSessions: vi.fn(),
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
}));

import { POST } from "./route";
import { cookies } from "next/headers";
import { validateUserSession, deleteAllUserSessions } from "@/lib/mongo/sessions";
import { findUserByIdFull, updateUserPassword } from "@/lib/mongo/users";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) => (name === "user_session" ? { value: "tok" } : undefined),
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
});
