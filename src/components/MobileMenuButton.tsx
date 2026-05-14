"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MobileMenuButton() {
  const t = useTranslations("common");
  function handleClick() {
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.toggle("-translate-x-full");
      sidebar.classList.toggle("translate-x-0");
      sidebar.classList.toggle("opacity-0");
      sidebar.classList.toggle("opacity-100");
      overlay.classList.toggle("pointer-events-none");
      overlay.classList.toggle("opacity-0");
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
