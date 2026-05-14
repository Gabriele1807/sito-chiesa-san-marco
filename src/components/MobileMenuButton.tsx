"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MobileMenuButton() {
  const t = useTranslations("common");
  function handleClick() {
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    const sidebarEl = sidebar as HTMLElement;
    const overlayEl = overlay as HTMLElement;
    const isOpen = !sidebarEl.classList.contains("-translate-x-full");

    function onOverlayTransition(e: Event) {
      const transitionEvent = e as TransitionEvent;
      if (transitionEvent.propertyName !== "opacity") return;
      if (getComputedStyle(overlayEl).opacity === "0") {
        overlayEl.classList.add("pointer-events-none");
      }
      overlayEl.removeEventListener("transitionend", onOverlayTransition);
    }

    overlayEl.addEventListener("transitionend", onOverlayTransition);

    if (isOpen) {
      sidebarEl.classList.add("-translate-x-full");
      sidebarEl.classList.remove("translate-x-0");
      sidebarEl.classList.add("opacity-0");
      sidebarEl.classList.remove("opacity-100");
      setTimeout(() => overlayEl.classList.add("opacity-0"), 260);
    } else {
      overlayEl.classList.remove("pointer-events-none");
      overlayEl.classList.remove("opacity-0");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sidebarEl.classList.remove("-translate-x-full");
        sidebarEl.classList.add("translate-x-0");
        sidebarEl.classList.remove("opacity-0");
        sidebarEl.classList.add("opacity-100");
      }));
    }
  }

  return (
    <button
      onClick={handleClick}
      className="p-2.5 rounded-xl text-foreground/70 hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={t("openMenu")}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
