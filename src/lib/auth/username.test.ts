import { describe, it, expect, vi, beforeEach } from "vitest";

const ilike = vi.fn();
const limit = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: () => ({
        ilike: (col: string, pattern: string) => {
          ilike(col, pattern);
          return { limit };
        },
      }),
    })),
  },
}));
vi.mock("@/lib/mongo/users", () => ({ findUsersByUsernameInsensitive: vi.fn() }));

import { normalizeUsername, isUsernameTaken } from "./username";
import { findUsersByUsernameInsensitive } from "@/lib/mongo/users";

const mongoMatches = findUsersByUsernameInsensitive as ReturnType<typeof vi.fn>;

describe("normalizeUsername", () => {
  it("trims and accepts letters, numbers, dot, dash and underscore", () => {
    expect(normalizeUsername("  mario.rossi_1-a ")).toBe("mario.rossi_1-a");
  });

  it("rejects too short, too long, spaces, symbols and non-strings", () => {
    expect(normalizeUsername("ab")).toBeNull();
    expect(normalizeUsername("a".repeat(31))).toBeNull();
    expect(normalizeUsername("mario rossi")).toBeNull();
    expect(normalizeUsername("mario@rossi")).toBeNull();
    expect(normalizeUsername(42)).toBeNull();
  });
});

describe("isUsernameTaken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mongoMatches.mockResolvedValue([]);
    limit.mockResolvedValue({ data: [], error: null });
  });

  it("is free when neither users nor admins use it", async () => {
    expect(await isUsernameTaken("mario")).toBe(false);
  });

  it("is taken when a MongoDB user has it with different casing", async () => {
    mongoMatches.mockResolvedValue([{ _id: "u2", username: "Mario" }]);
    expect(await isUsernameTaken("mario")).toBe(true);
  });

  it("is taken when an admin (Supabase) has it", async () => {
    limit.mockResolvedValue({ data: [{ id: "a9" }], error: null });
    expect(await isUsernameTaken("mario")).toBe(true);
  });

  it("ignores the accounts that already own it (renaming yourself or your linked account)", async () => {
    mongoMatches.mockResolvedValue([{ _id: "u1", username: "mario" }]);
    limit.mockResolvedValue({ data: [{ id: "a1" }], error: null });
    expect(await isUsernameTaken("Mario", { userId: "u1", adminId: "a1" })).toBe(false);
  });

  it("escapes LIKE wildcards so '_' matches only a literal underscore", async () => {
    await isUsernameTaken("mario_rossi");
    expect(ilike).toHaveBeenCalledWith("username", "mario\\_rossi");
  });

  it("treats a Supabase error as taken (never grants a possibly duplicated username)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    limit.mockResolvedValue({ data: null, error: { message: "down" } });
    expect(await isUsernameTaken("mario")).toBe(true);
  });
});
