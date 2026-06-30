"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MobileMenuButton() {
  const t = useTranslations("common");
  function handleClick() {
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    const isOpen = !sidebar.classList.contains("-translate-x-full");

    if (isOpen) {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      sidebar.classList.add("opacity-0");
      sidebar.classList.remove("opacity-100");
      overlay.classList.add("pointer-events-none");
      overlay.classList.add("opacity-0");
      return;
    }

    overlay.classList.remove("pointer-events-none");
    overlay.classList.remove("opacity-0");
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    sidebar.classList.remove("opacity-0");
    sidebar.classList.add("opacity-100");
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
