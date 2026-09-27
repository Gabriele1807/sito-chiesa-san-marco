import { describe, it, expect, vi, beforeEach } from "vitest";

const insert = vi.fn();
vi.mock("@/lib/mongo/audit-log", () => ({ recordAdminAction: vi.fn(), logAdminAction: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: (row: Record<string, unknown>) => {
        insert(row);
        return {
          select: () => ({ single: async () => ({ data: { id: "a2", ...row }, error: null }) }),
        };
      },
    })),
  },
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "hash") }));
vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminSession: vi.fn(async () => ({ id: "super", ruolo: "superadmin" })),
}));
vi.mock("@/lib/auth/username", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/username")>("@/lib/auth/username");
  return { ...actual, isUsernameTaken: vi.fn(async () => false) };
});

import { POST } from "./route";
import { isUsernameTaken } from "@/lib/auth/username";

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const body = { username: " nuovo.admin ", password: "Password1!", nome: "N", cognome: "A" };

describe("POST /api/admin/users — unicità username", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the admin with the normalized username when it is free everywhere", async () => {
    const res = await POST(mockRequest(body));
    expect(res.status).toBe(201);
    expect(isUsernameTaken).toHaveBeenCalledWith("nuovo.admin");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ username: "nuovo.admin" }));
  });

  it("refuses a username already used by a normal user or another admin", async () => {
    (isUsernameTaken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    const res = await POST(mockRequest(body));
    expect(res.status).toBe(409);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid username", async () => {
    const res = await POST(mockRequest({ ...body, username: "no spaces allowed" }));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
});
