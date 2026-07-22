"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSidebar } from "./sidebar/SidebarContext";

export default function MobileMenuButton() {
  const t = useTranslations("common");
  const { isMobileOpen, toggleMobile } = useSidebar();

  return (
    <button
      onClick={toggleMobile}
      className="p-2.5 rounded-xl text-foreground/70 hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={t("openMenu")}
      aria-expanded={isMobileOpen}
      aria-controls="mobile-sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
