import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  isIpRateLimited: vi.fn(async () => false),
  recordIpRequest: vi.fn(),
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "hash") }));
vi.mock("@/lib/mongo/users", () => ({
  createUser: vi.fn(async () => ({ _id: "u1" })),
  findUserByEmail: vi.fn(async () => null),
}));
vi.mock("@/lib/auth/username", () => ({ isUsernameTaken: vi.fn(async () => false) }));

import { POST } from "./route";
import { createUser } from "@/lib/mongo/users";
import { isUsernameTaken } from "@/lib/auth/username";

const validBody = {
  email: "mario@example.com",
  username: "Mario_1",
  password: "Valid123!",
  nome: "Mario",
  cognome: "Rossi",
  role: "credente",
  ageGroup: "19-29",
};

function mockRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register — unicità username", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks the username against users and admins before creating the account", async () => {
    const res = await POST(mockRequest(validBody));
    expect(res.status).toBe(201);
    expect(isUsernameTaken).toHaveBeenCalledWith("Mario_1");
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ username: "Mario_1" }));
  });

  it("refuses a username already used (any casing, user or admin)", async () => {
    (isUsernameTaken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    const res = await POST(mockRequest(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Username già in uso");
    expect(createUser).not.toHaveBeenCalled();
  });
});
