import { describe, it, expect, beforeAll } from "vitest";
import { signJwt, verifyJwt } from "./jwt";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
});

describe("signJwt / verifyJwt", () => {
  it("round-trips a payload signed with the configured secret", async () => {
    const token = await signJwt({ sub: "admin-1", sessionType: "admin" }, 3600);
    const payload = await verifyJwt<{ sub: string; sessionType: string }>(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("admin-1");
    expect(payload?.sessionType).toBe("admin");
  });

  it("rejects an expired token", async () => {
    const token = await signJwt({ sub: "admin-1" }, -10); // already expired
    const payload = await verifyJwt(token);
    expect(payload).toBeNull();
  });

  it("rejects a token whose signature was tampered with", async () => {
    const token = await signJwt({ sub: "admin-1" }, 3600);
    const [header, body] = token.split(".");
    const tampered = `${header}.${body}.tamperedSignature`;

    const payload = await verifyJwt(tampered);
    expect(payload).toBeNull();
  });

  it("rejects a payload signed with a different secret", async () => {
    const token = await signJwt({ sub: "admin-1" }, 3600);

    process.env.ADMIN_SESSION_SECRET = "a-completely-different-secret-value";
    const payload = await verifyJwt(token);
    expect(payload).toBeNull();

    // restore for any subsequent test in this file
    process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-32-characters-long";
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyJwt("not-a-jwt")).toBeNull();
    expect(await verifyJwt("")).toBeNull();
  });
});
