import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "./proxy";
import { signJwt } from "@/lib/auth/jwt";

function req(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} });
}

describe("proxy (/api/admin/*)", () => {
  beforeAll(() => {
    process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.KV_REST_API_URL;
  });

  it("only matches admin API routes", () => {
    expect(config.matcher).toEqual(["/api/admin/:path*"]);
  });

  it("rejects admin API calls without a session", async () => {
    const res = await proxy(req("/api/admin/eventi"));
    expect(res.status).toBe(401);
  });

  it("rejects a user session token used on admin routes", async () => {
    const token = await signJwt({ sub: "u1", sessionType: "user" }, 3600);
    const res = await proxy(req("/api/admin/eventi", `admin_session=${token}`));
    expect(res.status).toBe(401);
  });

  it("lets login/logout and valid admin sessions through", async () => {
    expect((await proxy(req("/api/admin/login"))).headers.get("x-middleware-next")).toBe("1");
    const token = await signJwt({ sub: "a1", sessionType: "admin" }, 3600);
    const res = await proxy(req("/api/admin/eventi", `admin_session=${token}`));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
