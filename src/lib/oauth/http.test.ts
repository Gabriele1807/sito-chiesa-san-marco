import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { applyNoStore } from "./http";

describe("applyNoStore", () => {
  it("sets Cache-Control: no-store on a JSON response", () => {
    const res = applyNoStore(NextResponse.json({ ok: true }));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("sets Cache-Control: no-store on a redirect response", () => {
    const res = applyNoStore(NextResponse.redirect("https://example.org/", { status: 307 }));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns the same response instance it was given", () => {
    const original = NextResponse.json({ ok: true });
    const res = applyNoStore(original);
    expect(res).toBe(original);
  });
});
