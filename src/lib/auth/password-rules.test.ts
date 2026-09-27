import { describe, it, expect } from "vitest";
import { passwordPolicyError } from "./password-rules";

describe("passwordPolicyError", () => {
  it("accepts a password meeting every rule", () => {
    expect(passwordPolicyError("Chiesa#2026")).toBeNull();
  });

  it.each([
    "password",
    "Password1",
    "PASSWORD1!",
    "password1!",
    "Pa1!",
    "A".repeat(126) + "a1!",
    12345678,
    undefined,
  ])("rejects %s", (password) => {
    expect(passwordPolicyError(password)).not.toBeNull();
  });
});
