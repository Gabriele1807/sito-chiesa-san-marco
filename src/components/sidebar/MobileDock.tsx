"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SidebarItem } from "./nav-config";
import { mobileDockItems } from "./nav-config";

export default function MobileDock() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");

  function openMobileMenu() {
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
      // closing: slide sidebar out first, then fade overlay
      sidebarEl.classList.add("-translate-x-full");
      sidebarEl.classList.remove("translate-x-0");
      sidebarEl.classList.add("opacity-0");
      sidebarEl.classList.remove("opacity-100");
      setTimeout(() => {
        overlayEl.classList.add("opacity-0");
      }, 260);
    } else {
      // opening: enable overlay, fade it in, then slide sidebar in
      overlayEl.classList.remove("pointer-events-none");
      overlayEl.classList.remove("opacity-0");
      // ensure the overlay paint happens before starting the slide
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sidebarEl.classList.remove("-translate-x-full");
        sidebarEl.classList.add("translate-x-0");
        sidebarEl.classList.remove("opacity-0");
        sidebarEl.classList.add("opacity-100");
      }));
    }
  }

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
                onClick={openMobileMenu}
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
