import { describe, it, expect } from "vitest";
import type { SectionVisibility } from "@/types";
import { accessForRole, viewerRole } from "./section-access-client";

const vis = (over: Partial<SectionVisibility> = {}): SectionVisibility => ({
  id: "calendario",
  sectionId: "calendario",
  sectionLabel: "Calendario",
  isActive: true,
  roleConfig: { guest: "full", credente: "full", admin: "full", superadmin: "full" },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("accessForRole", () => {
  it("allows a section without configuration (same fallback as the sidebar)", () => {
    expect(accessForRole([], "calendario", "guest")).toBe("full");
    expect(accessForRole([vis({ sectionId: "orari" })], "calendario", "guest")).toBe("full");
  });

  it("hides a globally disabled section for every role", () => {
    const list = [vis({ isActive: false })];
    expect(accessForRole(list, "calendario", "guest")).toBe("hidden");
    expect(accessForRole(list, "calendario", "superadmin")).toBe("hidden");
  });

  it("reads the access of the viewer's role", () => {
    const list = [vis({ roleConfig: { guest: "coming_soon", credente: "full", admin: "full" } })];
    expect(accessForRole(list, "calendario", "guest")).toBe("coming_soon");
    expect(accessForRole(list, "calendario", "credente")).toBe("full");
  });

  it("hides the section for a role without explicit configuration", () => {
    const list = [vis({ roleConfig: { guest: "full" } })];
    expect(accessForRole(list, "calendario", "prete")).toBe("hidden");
  });
});

describe("viewerRole", () => {
  it("maps the auth state to the visibility role", () => {
    expect(viewerRole("guest", null, null)).toBe("guest");
    expect(viewerRole("user", { role: "madre" }, null)).toBe("madre");
    expect(viewerRole("user", null, null)).toBe("guest");
    expect(viewerRole("admin", null, { ruolo: "admin" })).toBe("admin");
    expect(viewerRole("admin", null, { ruolo: "superadmin" })).toBe("superadmin");
  });
});
