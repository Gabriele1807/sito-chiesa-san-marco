import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/password-reset-tokens", () => ({
  consumePasswordResetToken: vi.fn(),
  releasePasswordResetToken: vi.fn(),
}));
vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(async () => ({ _id: "u1", attivo: true })),
  updateUserPassword: vi.fn(),
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
  consumePasswordResetToken,
  releasePasswordResetToken,
} from "@/lib/mongo/password-reset-tokens";
import { findUserByIdFull, updateUserPassword, setHasPassword } from "@/lib/mongo/users";
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
    (consumePasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(mockRequest({ token: "bad", newPassword: "Valid123!" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Link non valido o scaduto");
  });

  it("rejects a weak password", async () => {
    (consumePasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });
    const res = await POST(mockRequest({ token: "good", newPassword: "weak" }));
    expect(res.status).toBe(400);
    // Il link non viene bruciato da un tentativo con password debole.
    expect(consumePasswordResetToken).not.toHaveBeenCalled();
  });

  it("resets the password, consumes the token, and invalidates other sessions", async () => {
    (consumePasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });

    const res = await POST(mockRequest({ token: "good", newPassword: "Valid123!" }));
    const json = await res.json();

    expect(json).toEqual({ success: true });
    expect(updateUserPassword).toHaveBeenCalledWith("u1", "newhash");
    expect(setHasPassword).toHaveBeenCalledWith("u1", true);
    expect(consumePasswordResetToken).toHaveBeenCalledWith("good");
    // deleteAllUserSessions is what actually sets passwordChangedAt (see route.ts comment).
    expect(deleteAllUserSessions).toHaveBeenCalledWith("u1");
  });

  it("rejects a token that was already consumed by a concurrent request", async () => {
    (consumePasswordResetToken as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _id: "tok1", userId: "u1" })
      .mockResolvedValueOnce(null);

    const [first, second] = await Promise.all([
      POST(mockRequest({ token: "good", newPassword: "Valid123!" })),
      POST(mockRequest({ token: "good", newPassword: "Other123!" })),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 400]);
    expect(updateUserPassword).toHaveBeenCalledTimes(1);
  });

  it("does not reset the password of a deactivated account", async () => {
    (consumePasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
    });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: "u1",
      attivo: false,
    });

    const res = await POST(mockRequest({ token: "good", newPassword: "Valid123!" }));

    expect(res.status).toBe(400);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("releases the consumed token when saving the new password fails", async () => {
    const consumedAt = new Date();
    (consumePasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: "tok1",
      userId: "u1",
      consumedAt,
    });
    (updateUserPassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(mockRequest({ token: "good", newPassword: "Valid123!" }));

    expect(res.status).toBe(500);
    expect(releasePasswordResetToken).toHaveBeenCalledWith("tok1", consumedAt);
    expect(deleteAllUserSessions).not.toHaveBeenCalled();
  });
});
