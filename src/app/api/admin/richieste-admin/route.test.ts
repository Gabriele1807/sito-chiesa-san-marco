import { describe, it, expect, vi, beforeEach } from "vitest";

let existingAdminEmail: string | null = null;
const adminUpdate = vi.fn();
vi.mock("@/lib/mongo/audit-log", () => ({ recordAdminAction: vi.fn(), logAdminAction: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: async () => ({ error: { code: "23505", message: "duplicate key value" } }),
      update: (payload: Record<string, unknown>) => {
        adminUpdate(payload);
        return { eq: async () => ({ error: null }) };
      },
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: existingAdminEmail ? { email: existingAdminEmail } : null,
          }),
        }),
      }),
    })),
  },
}));
vi.mock("@/lib/mongo/users", () => ({
  getPendingAdminRequests: vi.fn(),
  updateAdminRequest: vi.fn(),
  findUserById: vi.fn(async () => ({
    _id: "u1",
    username: "mario",
    email: "mario@example.com",
    nome: "Mario",
    cognome: "Rossi",
    adminRequest: "pending",
  })),
  findUserByIdFull: vi.fn(async () => ({ passwordHash: "hash" })),
  updateUser: vi.fn(),
}));
vi.mock("@/lib/auth/permissions", () => ({ isSuperAdmin: () => true }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminSession: vi.fn(async () => ({ id: "super", ruolo: "superadmin" })),
}));

import { POST } from "./route";
import { updateAdminRequest } from "@/lib/mongo/users";

function approve() {
  return POST(
    new Request("http://localhost/api/admin/richieste-admin", {
      method: "POST",
      body: JSON.stringify({ userId: "u1", action: "approve" }),
    })
  );
}

describe("POST /api/admin/richieste-admin — username già presente su Supabase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses to link the user to an existing admin account belonging to someone else", async () => {
    existingAdminEmail = "altra.persona@example.com";
    const res = await approve();
    expect(res.status).toBe(409);
    expect(updateAdminRequest).not.toHaveBeenCalled();
  });

  it("approves when the existing admin account is the same person (same email)", async () => {
    existingAdminEmail = "Mario@Example.com";
    const res = await approve();
    expect(res.status).toBe(200);
    expect(updateAdminRequest).toHaveBeenCalledWith("u1", "approved");
  });

  it("reactivates a previously revoked admin account of the same person", async () => {
    existingAdminEmail = "mario@example.com";
    const res = await approve();
    expect(res.status).toBe(200);
    expect(adminUpdate).toHaveBeenCalledWith({ attivo: true, ruolo: "admin" });
  });

  it("does not touch the existing admin row when it belongs to someone else", async () => {
    existingAdminEmail = "altra.persona@example.com";
    await approve();
    expect(adminUpdate).not.toHaveBeenCalled();
  });
});
