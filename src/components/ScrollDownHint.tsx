"use client";

import { MouseEvent } from "react";
import { ChevronDown } from "lucide-react";

export default function ScrollDownHint({ targetId = "quick-access" }: { targetId?: string }) {
  function handleClick(e: MouseEvent) {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <button onClick={handleClick} aria-label="Scroll to next section" className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-white/80 shadow-sm">
      <ChevronDown className="h-4 w-4 text-accent animate-scroll-hint" />
    </button>
  );
}
