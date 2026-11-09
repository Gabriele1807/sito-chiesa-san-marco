import { describe, it, expect } from "vitest";
import type { RoleAccessType } from "@/types";
import { DOCK_PRIORITY, DOCK_SLOTS, dockCandidates, pickDockItems } from "./dock-items";

const ids = (access: Record<string, RoleAccessType | null> = {}) =>
  pickDockItems(dockCandidates(), (sectionId) =>
    sectionId in access ? access[sectionId] : "full"
  ).map((i) => i.id);

describe("dockCandidates", () => {
  it("follows the priority order and finds every item in the navigation", () => {
    expect(dockCandidates().map((i) => i.id)).toEqual([...DOCK_PRIORITY]);
  });
});

describe("pickDockItems", () => {
  it("shows home, orari and calendario first, then the next sections", () => {
    expect(ids()).toEqual(["home", "orari", "calendario", "preghiere", "eventi"]);
    expect(ids()).toHaveLength(DOCK_SLOTS);
  });

  it("skips hidden sections and fills the slot with the next one", () => {
    expect(ids({ calendario: "hidden", preghiere: "hidden" })).toEqual([
      "home",
      "orari",
      "eventi",
      "video-corsi",
      "icone",
    ]);
  });

  it("skips 'coming soon' sections (the dock links only to open sections)", () => {
    expect(ids({ eventi: "coming_soon" })).toEqual([
      "home",
      "orari",
      "calendario",
      "preghiere",
      "video-corsi",
    ]);
  });

  it("keeps sections whose access is not known yet (no flicker while loading)", () => {
    expect(ids({ calendario: null, orari: null })).toEqual([
      "home",
      "orari",
      "calendario",
      "preghiere",
      "eventi",
    ]);
  });

  it("falls back to the sections without visibility settings when everything is hidden", () => {
    const allHidden = Object.fromEntries(
      dockCandidates()
        .filter((i) => i.sectionId)
        .map((i) => [i.sectionId!, "hidden" as const])
    );
    expect(ids(allHidden)).toEqual(["home", "avvisi", "contatti"]);
  });
});
