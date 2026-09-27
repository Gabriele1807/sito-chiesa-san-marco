import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongo/audit-log", () => ({ recordAdminAction: vi.fn(), logAdminAction: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAdminSession: vi.fn(async () => ({ id: "a1" })) }));
vi.mock("@/lib/cache/content-revalidate", () => ({ revalidatePublicContent: vi.fn() }));
vi.mock("@/lib/mongo/registrations", () => ({ deleteIscrizioniByEvento: vi.fn() }));
vi.mock("@/lib/mongo/content", () => ({
  getEventi: vi.fn(),
  addEvento: vi.fn(async (data: object) => ({ ...data, id: "1" })),
  updateEvento: vi.fn(async (id: string, data: object) => ({ ...data, id })),
  deleteEvento: vi.fn(),
}));

import { POST, PUT } from "./route";
import { addEvento, updateEvento } from "@/lib/mongo/content";
import { recordAdminAction } from "@/lib/mongo/audit-log";

function req(method: string, body: unknown) {
  return new Request("http://localhost/api/admin/eventi", { method, body: JSON.stringify(body) });
}

describe("/api/admin/eventi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("POST stores only whitelisted fields", async () => {
    const res = await POST(
      req("POST", { titolo: "Festa", data: "2026-05-01", id: "7", admin: true })
    );
    expect(res.status).toBe(201);
    expect(addEvento).toHaveBeenCalledWith({ titolo: "Festa", data: "2026-05-01" });
    expect(recordAdminAction).toHaveBeenCalledWith({
      action: "create",
      entity: "eventi",
      entityId: "1",
      summary: 'Evento "Festa"',
    });
  });

  it("POST rejects invalid data with 400 without touching the database", async () => {
    const res = await POST(
      req("POST", { titolo: "Festa", data: "2026-05-01", immagine: "javascript:x" })
    );
    expect(res.status).toBe(400);
    expect(addEvento).not.toHaveBeenCalled();
    expect(recordAdminAction).not.toHaveBeenCalled();
  });

  it("PUT rejects an operator object as id", async () => {
    const res = await PUT(req("PUT", { id: { $ne: null }, titolo: "X" }));
    expect(res.status).toBe(400);
    expect(updateEvento).not.toHaveBeenCalled();
  });

  it("PUT updates with sanitized data only", async () => {
    const res = await PUT(req("PUT", { id: "3", titolo: "Nuovo", _id: "zzz" }));
    expect(res.status).toBe(200);
    expect(updateEvento).toHaveBeenCalledWith("3", { titolo: "Nuovo" });
  });
});
