"use client";

import { usePathname } from "next/navigation";
import HashLink from "@/components/HashLink";
import { useTranslations } from "next-intl";
import { useSectionAccessResolver } from "@/components/useSectionAccess";
import type { SidebarItem } from "./nav-config";
import { mobileDockMenuItem } from "./nav-config";
import { dockCandidates, pickDockItems } from "./dock-items";
import { useSidebar } from "./SidebarContext";
import { useActiveHashSection } from "./useActiveHashSection";

const CANDIDATES = dockCandidates();
const HASH_SECTION_IDS = CANDIDATES.map((item) => item.href)
  .filter((href): href is string => !!href && href.includes("#"))
  .map((href) => href.split("#")[1]);

export default function MobileDock() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const tDock = useTranslations("dock");
  const { toggleMobile } = useSidebar();
  const activeHashSection = useActiveHashSection(HASH_SECTION_IDS);

  // Sezioni aperte per il visitatore, in ordine di priorità, più "Menu".
  const accessOf = useSectionAccessResolver();
  const items = [...pickDockItems(CANDIDATES, accessOf), mobileDockMenuItem];

  function isActive(item: SidebarItem) {
    if (!item.href) return false;

    const hashIndex = item.href.indexOf("#");
    if (hashIndex !== -1) {
      const targetPath = item.href.slice(0, hashIndex) || "/";
      const targetHash = item.href.slice(hashIndex + 1);
      return pathname === targetPath && activeHashSection === targetHash;
    }

    if (item.href === "/") {
      return pathname === item.href && !activeHashSection;
    }
    // Nel dock una voce copre anche le sue sotto-pagine (es. Calendario su
    // /calendario/feste, che nel dock non ha una voce propria).
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  // Etichetta breve visibile sotto l'icona ("Orari" invece di "Orari settimanali").
  function getShortLabel(item: SidebarItem) {
    const key = item.labelKey as Parameters<typeof tDock>[0];
    return tDock.has(key) ? tDock(key) : getLabel(item);
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
      className="bg-sidebar fixed right-0 bottom-0 left-0 z-40 border-t border-white/10 pb-[env(safe-area-inset-bottom)] text-white lg:hidden"
    >
      <div
        className="grid gap-0.5 px-1.5 py-1.5"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const label = getLabel(item);
          const active = isActive(item);
          const shortLabel = getShortLabel(item);
          const baseClass = `flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0 py-1.5 text-[10px] font-semibold leading-tight tracking-tight transition min-[375px]:text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
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
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span aria-hidden className="max-w-full truncate">
                  {shortLabel}
                </span>
              </button>
            );
          }

          if (!item.href) return null;

          return (
            <HashLink
              key={item.id}
              href={item.href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={baseClass}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span aria-hidden className="max-w-full truncate">
                {shortLabel}
              </span>
            </HashLink>
          );
        })}
      </div>
    </nav>
  );
}
