import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/users", () => ({
  findUserByIdFull: vi.fn(),
}));

import { validateUserSession } from "@/lib/mongo/sessions";
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
});
