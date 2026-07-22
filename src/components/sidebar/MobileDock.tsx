"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SidebarItem } from "./nav-config";
import { mobileDockItems } from "./nav-config";
import { useSidebar } from "./SidebarContext";

export default function MobileDock() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const { toggleMobile } = useSidebar();

  function isActive(item: SidebarItem) {
    if (!item.href) return false;
    if (item.activeMatch === "exact" || item.href === "/") {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  function getLabel(item: SidebarItem) {
    const namespace = item.labelNamespace ?? "nav";
    if (namespace === "sidebar") {
      return tSidebar(item.labelKey as Parameters<typeof tSidebar>[0]);
    }
    return tNav(item.labelKey as Parameters<typeof tNav>[0]);
  }

  return (
    <nav
      aria-label="Mobile dock"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-sidebar text-white border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-6 gap-1 px-2 py-1.5">
        {mobileDockItems.map((item) => {
          const Icon = item.icon;
          const label = getLabel(item);
          const active = isActive(item);
          const baseClass = `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
            active ? "bg-white text-sidebar" : "text-white/70 hover:text-white hover:bg-white/10"
          }`;

          if (item.actionId === "openMobileMenu") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={toggleMobile}
                className={baseClass}
                aria-label={label}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="sr-only">{label}</span>
              </button>
            );
          }

          if (!item.href) return null;

          return (
            <Link key={item.id} href={item.href} aria-label={label} className={baseClass}>
              <Icon className="h-4.5 w-4.5" />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
