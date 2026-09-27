import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
}));

// Deny-list simulata in memoria (su MongoDB nel codice reale).
const revoked = new Set<string>();
vi.mock("./revoked-sessions", () => ({
  isUserSessionTokenRevoked: vi.fn(async (token: string) => revoked.has(token)),
  revokeUserSessionToken: vi.fn(async (token: string) => {
    revoked.add(token);
  }),
}));

import { validateUserSession, createUserSession, deleteUserSession } from "@/lib/mongo/sessions";
import { revokeUserSessionToken } from "./revoked-sessions";
import { signJwt } from "@/lib/auth/jwt";
import { findUserByIdFull } from "@/lib/mongo/users";

const mockFindUser = findUserByIdFull as unknown as ReturnType<typeof vi.fn>;

describe("validateUserSession", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret-value-not-real");
    mockFindUser.mockReset();
  });

  it("rejects a token issued before passwordChangedAt", async () => {
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const result = await validateUserSession(token);
    expect(result).toBeNull();
  });

  it("accepts a token issued after passwordChangedAt", async () => {
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);

    const result = await validateUserSession(token);
    expect(result).toEqual({ userId: "user-1" });
  });

  it("accepts a token when the user has no passwordChangedAt (back-compat)", async () => {
    mockFindUser.mockResolvedValue({ _id: "user-1" });
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);

    const result = await validateUserSession(token);
    expect(result).toEqual({ userId: "user-1" });
  });

  it("rejects a token issued in the same second as passwordChangedAt", async () => {
    const token = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);
    const payloadSegment = token.split(".")[1];
    const iat = JSON.parse(Buffer.from(payloadSegment, "base64url").toString()).iat as number;
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(iat * 1000).toISOString(),
    });

    const result = await validateUserSession(token);
    expect(result).toBeNull();
  });

  it("accepts a session re-issued with the current passwordChangedAt even in the same second", async () => {
    const oldToken = await signJwt({ sub: "user-1", sessionType: "user" }, 3600);
    const passwordChangedAt = new Date().toISOString();
    const { token: reissued } = await createUserSession(
      "user-1",
      new Request("http://localhost"),
      false,
      { passwordChangedAt }
    );
    mockFindUser.mockResolvedValue({ _id: "user-1", passwordChangedAt });

    expect(await validateUserSession(reissued)).toEqual({ userId: "user-1" });
    expect(await validateUserSession(oldToken)).toBeNull();
  });

  it("rejects a re-issued session once the password changes again", async () => {
    const firstChange = new Date(Date.now() - 1000).toISOString();
    const { token } = await createUserSession("user-1", new Request("http://localhost"), false, {
      passwordChangedAt: firstChange,
    });
    mockFindUser.mockResolvedValue({
      _id: "user-1",
      passwordChangedAt: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(await validateUserSession(token)).toBeNull();
  });

  it("rejects a token after logout (per-token revocation)", async () => {
    mockFindUser.mockResolvedValue({ _id: "user-1" });
    const { token } = await createUserSession("user-1", new Request("http://localhost"));
    expect(await validateUserSession(token)).toEqual({ userId: "user-1" });

    await deleteUserSession(token);

    expect(await validateUserSession(token)).toBeNull();
    // Registrato fino alla scadenza naturale del token.
    expect(revokeUserSessionToken).toHaveBeenCalledWith(token, expect.any(Number), "user-1");
  });

  it("logging out one session does not affect the user's other sessions", async () => {
    mockFindUser.mockResolvedValue({ _id: "user-1" });
    const { token: phone } = await createUserSession("user-1", new Request("http://localhost"));
    const laptop = await signJwt({ sub: "user-1", sessionType: "user", device: "laptop" }, 3600);

    await deleteUserSession(phone);

    expect(await validateUserSession(laptop)).toEqual({ userId: "user-1" });
  });

  it("does not record invalid or foreign tokens at logout", async () => {
    vi.mocked(revokeUserSessionToken).mockClear();
    await deleteUserSession("not-a-jwt");
    await deleteUserSession(await signJwt({ sub: "a1", sessionType: "admin" }, 3600));
    expect(revokeUserSessionToken).not.toHaveBeenCalled();
  });
});
