"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const ACTIVATION_OFFSET = 96; // roughly navbar height + a small buffer

/**
 * Tracks which in-page section (by element id) is currently "in focus" near
 * the top of the viewport, so the sidebar can highlight e.g. "Orari" while
 * the user scrolls past #orari on the home page, not only right after
 * clicking the link. Returns null when no tracked section has reached the
 * activation line yet (e.g. at the very top of the page, or on a different
 * route), so callers can fall back to their normal route-based active state.
 *
 * Uses a plain scroll listener + getBoundingClientRect instead of
 * IntersectionObserver: browsers throttle/pause IO callbacks for
 * backgrounded tabs, which made this flaky to verify and would also delay
 * the highlight for a user with several tabs open.
 */
export function useActiveHashSection(ids: string[]): string | null {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (pathname !== "/" || !idsKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveId(null);
      return;
    }

    const trackedIds = idsKey.split(",");

    function computeActive() {
      let current: string | null = null;
      for (const id of trackedIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= ACTIVATION_OFFSET && rect.bottom > ACTIVATION_OFFSET) {
          current = id;
          break;
        }
      }
      setActiveId((prev) => (prev === current ? prev : current));
    }

    computeActive();
    window.addEventListener("scroll", computeActive, { passive: true });
    window.addEventListener("resize", computeActive);
    return () => {
      window.removeEventListener("scroll", computeActive);
      window.removeEventListener("resize", computeActive);
    };
  }, [pathname, idsKey]);

  return activeId;
}
