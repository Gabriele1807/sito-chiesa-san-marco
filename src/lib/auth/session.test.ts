import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// Riga admin_users restituita dal "database" (null = non trovata / non attiva).
let adminRow: Record<string, unknown> | null = null;
const eqCalls: [string, unknown][] = [];

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => {
      const query = {
        select: () => query,
        eq: (col: string, value: unknown) => {
          eqCalls.push([col, value]);
          return query;
        },
        single: async () => {
          const attivoFilter = eqCalls.find(([c]) => c === "attivo")?.[1];
          if (!adminRow || (attivoFilter === true && adminRow.attivo !== true)) {
            return { data: null, error: { message: "not found" } };
          }
          return { data: adminRow, error: null };
        },
      };
      return query;
    },
  },
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { validateSession, createSession, deleteSession } from "./session";
import { signJwt } from "./jwt";

const baseAdmin = {
  id: "a1",
  username: "mario",
  email: "mario@example.com",
  nome: "Mario",
  cognome: "Rossi",
  ruolo: "superadmin",
  attivo: true,
  ultimo_accesso: null,
};

async function issueToken() {
  adminRow = { ...baseAdmin };
  const { token } = await createSession("a1", new Request("http://localhost"), false);
  return token;
}

describe("validateSession (admin)", () => {
  beforeAll(() => {
    process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.KV_REST_API_URL;
  });
  beforeEach(() => {
    eqCalls.length = 0;
  });

  it("returns the current admin for a valid token", async () => {
    const token = await issueToken();
    expect(await validateSession(token)).toMatchObject({ id: "a1", ruolo: "superadmin" });
  });

  it("rejects a token after the admin has been deactivated", async () => {
    const token = await issueToken();
    adminRow = { ...baseAdmin, attivo: false };
    expect(await validateSession(token)).toBeNull();
  });

  it("rejects a token after the admin has been deleted", async () => {
    const token = await issueToken();
    adminRow = null;
    expect(await validateSession(token)).toBeNull();
  });

  it("applies a role downgrade immediately (DB role wins over the token)", async () => {
    const token = await issueToken();
    adminRow = { ...baseAdmin, ruolo: "admin" };
    expect(await validateSession(token)).toMatchObject({ ruolo: "admin" });
  });

  it("rejects a token revoked at logout", async () => {
    const token = await issueToken();
    await deleteSession(token);
    expect(await validateSession(token)).toBeNull();
  });

  it("rejects user-session tokens", async () => {
    adminRow = { ...baseAdmin };
    const token = await signJwt({ sub: "a1", sessionType: "user" }, 3600);
    expect(await validateSession(token)).toBeNull();
  });
});
