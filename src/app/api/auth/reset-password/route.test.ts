import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/password-reset-tokens", () => ({
  findValidPasswordResetToken: vi.fn(),
  markPasswordResetTokenUsed: vi.fn(),
}));
vi.mock("@/lib/mongo/users", () => ({
  updateUserPassword: vi.fn(),
  setPasswordChangedAt: vi.fn(),
  setHasPassword: vi.fn(),
}));
vi.mock("@/lib/mongo/sessions", () => ({ deleteAllUserSessions: vi.fn() }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn().mockResolvedValue("newhash") }));
vi.mock("@/lib/auth/password-reset-rate-limit", () => ({
  isResetPasswordRateLimited: vi.fn().mockResolvedValue(false),
  recordResetPasswordAttempt: vi.fn(),
}));

import { POST } from "./route";
import {
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/mongo/password-reset-tokens";
import { updateUserPassword, setPasswordChangedAt, setHasPassword } from "@/lib/mongo/users";
import { deleteAllUserSessions } from "@/lib/mongo/sessions";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a missing token", async () => {
    const res = await POST(mockRequest({ token: "", newPassword: "Valid123!" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid or expired token with a generic message", async () => {
    (findValidPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(mockRequest({ token: "bad", newPassword: "Valid123!" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Link non valido o scaduto");
  });

  it("rejects a weak password", async () => {
    (findValidPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });
    const res = await POST(mockRequest({ token: "good", newPassword: "weak" }));
    expect(res.status).toBe(400);
  });

  it("resets the password, marks the token used, and invalidates other sessions", async () => {
    (findValidPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });

    const res = await POST(mockRequest({ token: "good", newPassword: "Valid123!" }));
    const json = await res.json();

    expect(json).toEqual({ success: true });
    expect(updateUserPassword).toHaveBeenCalledWith("u1", "newhash");
    expect(setHasPassword).toHaveBeenCalledWith("u1", true);
    expect(setPasswordChangedAt).toHaveBeenCalledWith("u1");
    expect(markPasswordResetTokenUsed).toHaveBeenCalledWith("tok1");
    expect(deleteAllUserSessions).toHaveBeenCalledWith("u1");
  });
});
