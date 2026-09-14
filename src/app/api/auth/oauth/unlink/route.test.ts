import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({ findUserByIdFull: vi.fn() }));
vi.mock("@/lib/mongo/oauth-identities", () => ({
  countOAuthIdentitiesByUserId: vi.fn(),
  deleteOAuthIdentity: vi.fn(),
}));

import { POST } from "./route";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { countOAuthIdentitiesByUserId, deleteOAuthIdentity } from "@/lib/mongo/oauth-identities";

beforeEach(() => vi.clearAllMocks());

function req(body: unknown, cookie = "user_session=token") {
  return new Request("https://example.org/api/auth/oauth/unlink", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/oauth/unlink", () => {
  it("returns 401 without a valid session", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(req({ provider: "google" }));
    expect(res.status).toBe(401);
  });

  it("blocks unlinking the only remaining auth method (no password, one identity)", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: false });
    (countOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await POST(req({ provider: "google" }));
    expect(res.status).toBe(400);
    expect(deleteOAuthIdentity).not.toHaveBeenCalled();
  });

  it("allows unlinking when a password is set", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: true });
    (countOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (deleteOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await POST(req({ provider: "google" }));
    expect(res.status).toBe(200);
    expect(deleteOAuthIdentity).toHaveBeenCalledWith("user-1", "google");
  });

  it("allows unlinking when another provider is still linked", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: false });
    (countOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (deleteOAuthIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await POST(req({ provider: "facebook" }));
    expect(res.status).toBe(200);
  });
});
