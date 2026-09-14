import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/sessions", () => ({ validateUserSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ validateSession: vi.fn() }));
vi.mock("@/lib/mongo/users", () => ({ findUserByIdFull: vi.fn() }));
vi.mock("@/lib/mongo/oauth-identities", () => ({ findOAuthIdentitiesByUserId: vi.fn() }));

import { GET } from "./route";
import { validateUserSession } from "@/lib/mongo/sessions";
import { validateSession as validateAdminSession } from "@/lib/auth/session";
import { findUserByIdFull } from "@/lib/mongo/users";
import { findOAuthIdentitiesByUserId } from "@/lib/mongo/oauth-identities";

beforeEach(() => {
  vi.clearAllMocks();
  (validateAdminSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
});

function req(cookie = "user_session=token") {
  return new Request("https://example.org/api/auth/oauth/status", { headers: { cookie } });
}

describe("GET /api/auth/oauth/status", () => {
  it("returns 401 without a valid session", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(req(""));
    expect(res.status).toBe(401);
  });

  it("returns hasPassword and linked identities for the current user", async () => {
    (validateUserSession as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (findUserByIdFull as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: "user-1", hasPassword: true });
    (findOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "google", linkedAt: "2026-01-01", providerEmail: "a@b.com" },
    ]);

    const res = await GET(req());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hasPassword).toBe(true);
    expect(body.identities).toEqual([
      { provider: "google", linkedAt: "2026-01-01", providerEmail: "a@b.com" },
    ]);
    expect(findOAuthIdentitiesByUserId).toHaveBeenCalledWith("user-1", "user");
  });

  it("returns hasPassword:true unconditionally for an admin session, without checking Mongo users", async () => {
    (validateAdminSession as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "admin-1", attivo: true });
    (findOAuthIdentitiesByUserId as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "facebook", linkedAt: "2026-02-02", providerEmail: "admin@b.com" },
    ]);

    const res = await GET(req("admin_session=admin-token"));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.hasPassword).toBe(true);
    expect(findUserByIdFull).not.toHaveBeenCalled();
    expect(findOAuthIdentitiesByUserId).toHaveBeenCalledWith("admin-1", "admin");
  });
});
