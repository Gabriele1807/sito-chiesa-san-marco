import { describe, it, expect } from "vitest";
import { sanitizeReturnTo } from "./safe-redirect";

describe("sanitizeReturnTo", () => {
  it("accepts a simple relative path", () => {
    expect(sanitizeReturnTo("/profilo", "/")).toBe("/profilo");
  });

  it("accepts a relative path with query string", () => {
    expect(sanitizeReturnTo("/eventi?tab=iscrizioni", "/")).toBe("/eventi?tab=iscrizioni");
  });

  it("falls back when value is missing", () => {
    expect(sanitizeReturnTo(null, "/fallback")).toBe("/fallback");
    expect(sanitizeReturnTo(undefined, "/fallback")).toBe("/fallback");
    expect(sanitizeReturnTo("", "/fallback")).toBe("/fallback");
  });

  it("rejects an absolute URL to an external host", () => {
    expect(sanitizeReturnTo("https://evil.example", "/fallback")).toBe("/fallback");
    expect(sanitizeReturnTo("http://evil.example/phish", "/fallback")).toBe("/fallback");
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeReturnTo("//evil.example", "/fallback")).toBe("/fallback");
  });

  it("rejects a backslash-based protocol-relative bypass", () => {
    expect(sanitizeReturnTo("/\\evil.example", "/fallback")).toBe("/fallback");
  });

  it("rejects a value containing whitespace", () => {
    expect(sanitizeReturnTo("/foo bar", "/fallback")).toBe("/fallback");
  });

  it("rejects a value not starting with a slash", () => {
    expect(sanitizeReturnTo("evil.example", "/fallback")).toBe("/fallback");
  });
});
