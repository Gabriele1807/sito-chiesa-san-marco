"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthContext";
import type { SidebarItem } from "./nav-config";
import type { SectionVisibility, RoleAccessType } from "@/types";
import { infoSection, modeToggleItems, primarySection, utilitySection } from "./nav-config";

const DOCK_WIDTH = 240;
const DOCK_WIDTH_COMPACT = 72;

export default function SidebarDock() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { type, user, admin, setShowLoginModal, setShowRegisterModal } = useAuth();
  const [isCompact, setIsCompact] = useState(false);
  const [sectionVisibilities, setSectionVisibilities] = useState<SectionVisibility[]>([]);
  const [visibilitiesLoaded, setVisibilitiesLoaded] = useState(false);

  const isAdmin = type === "admin";

  // Determina il ruolo dell'utente per i controlli di visibilità
  function getUserRole(): "guest" | "credente" | "madre" | "padre" | "ospite_chiesa" | "admin" | "superadmin" {
    if (type === "admin") {
      return admin?.ruolo === "superadmin" ? "superadmin" : "admin";
    }
    if (type === "user" && user?.role) {
      return user.role;
    }
    return "guest";
  }

  // Carica le configurazioni di visibilità al mount
  useEffect(() => {
    async function loadVisibilities() {
      try {
        const res = await fetch("/api/public/section-visibility");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSectionVisibilities(data.data);
        }
      } catch {
        // Ignora errori, usa configurazione di default
      } finally {
        setVisibilitiesLoaded(true);
      }
    }
    
    loadVisibilities();
  }, []);

  // Determina l'accesso di una sezione per il ruolo attuale
  function getAccessForSection(sectionId?: string): RoleAccessType {
    if (!sectionId) return "full"; // Se non ha sectionId, assume accesso completo
    
    const visibility = sectionVisibilities.find((v) => v.sectionId === sectionId);
    if (!visibility) return "full"; // Se non trovato, assume accesso completo
    
    if (!visibility.isActive) return "hidden"; // Se globalmente disattivo, nascosto
    
    const userRole = getUserRole();
    const roleAccess = visibility.roleConfig[userRole as keyof typeof visibility.roleConfig];
    
    return roleAccess || "hidden"; // Default: hidden
  }

  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem("dock_compact") === "true";
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with persisted UI preference post-mount.
      setIsCompact(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--dock-width",
        isCompact ? `${DOCK_WIDTH_COMPACT}px` : `${DOCK_WIDTH}px`
      );
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("dock_compact", isCompact ? "true" : "false");
    }
  }, [isCompact]);

  const sections = useMemo(() => [primarySection, infoSection], []);

  function closeMobile() {
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    const sidebarEl = sidebar as HTMLElement;
    const overlayEl = overlay as HTMLElement;

    function onOverlayTransition(e: Event) {
      const transitionEvent = e as TransitionEvent;
      if (transitionEvent.propertyName !== "opacity") return;
      if (getComputedStyle(overlayEl).opacity === "0") {
        overlayEl.classList.add("pointer-events-none");
      }
      overlayEl.removeEventListener("transitionend", onOverlayTransition);
    }

    overlayEl.addEventListener("transitionend", onOverlayTransition);

    sidebarEl.classList.add("-translate-x-full");
    sidebarEl.classList.remove("translate-x-0");
    sidebarEl.classList.add("opacity-0");
    sidebarEl.classList.remove("opacity-100");
    setTimeout(() => overlayEl.classList.add("opacity-0"), 260);
  }

  function isActive(item: SidebarItem) {
    if (!item.href) return false;
    if (item.activeMatch === "exact" || item.href === "/") {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  function getLabel(item: SidebarItem) {
    const namespace = item.labelNamespace ?? (item.type === "primary-nav" ? "nav" : "sidebar");
    switch (namespace) {
      case "nav":
        return tNav(item.labelKey as Parameters<typeof tNav>[0]);
      case "auth":
        return tAuth(item.labelKey as Parameters<typeof tAuth>[0]);
      case "common":
        return tCommon(item.labelKey as Parameters<typeof tCommon>[0]);
      default:
        return tSidebar(item.labelKey as Parameters<typeof tSidebar>[0]);
    }
  }

  function handleAction(item: SidebarItem) {
    if (item.actionId === "openLogin") {
      setShowLoginModal(true);
    }
    if (item.actionId === "openRegister") {
      setShowRegisterModal(true);
    }
    if (item.actionId === "toggleDock") {
      setIsCompact((prev) => !prev);
    }
  }

  function canShow(item: SidebarItem) {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresAuth && type === "guest") return false;
    if (item.requiresGuest && type !== "guest") return false;
    return true;
  }

  function renderItem(item: SidebarItem) {
    if (!canShow(item)) return null;

    // Controlla la visibilità dinamica della sezione
    const sectionAccess = getAccessForSection(item.sectionId);
    
    // Se hidden e le visibilità sono state caricate, non renderizzare
    if (sectionAccess === "hidden" && visibilitiesLoaded) {
      return null;
    }

    const label = getLabel(item);
    const subLabel = item.subKey ? tSidebar(item.subKey as Parameters<typeof tSidebar>[0]) : null;
    const active = isActive(item);
    const Icon = item.icon;
    
    // Determina se mostrare coming soon:
    // - Se sectionAccess è "coming_soon", mostra coming soon
    // - Se l'item ha comingSoon=true e l'utente non è admin, mostra coming soon (legacy)
    const isComingSoon = (sectionAccess === "coming_soon" && visibilitiesLoaded) || (item.comingSoon && !isAdmin);
    
    const isToggle = item.type === "mode-toggle";
    const isSelected = isToggle && item.actionId === "toggleDock" ? isCompact : false;
    const isActiveState = active || isSelected;

    const spacingClass = isCompact
      ? "justify-center px-2 py-2.5"
      : isToggle
      ? "gap-2 px-3 py-2"
      : "gap-2.5 px-3 py-2";
    const baseClass = `sidebar-link group flex w-full items-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${spacingClass}`;
    const labelClass = `min-w-0 flex-1 overflow-hidden transition-[max-width,opacity,transform] duration-200 ease-out ${
      isCompact ? "max-w-0 opacity-0 -translate-x-2" : "max-w-[160px] opacity-100 translate-x-0"
    }`;
    const badgeClass = `overflow-hidden transition-[max-width,opacity,transform] duration-200 ease-out ${
      isCompact ? "max-w-0 opacity-0 translate-x-1" : "max-w-[56px] opacity-100 translate-x-0"
    }`;
    const subLabelClass = isActiveState ? "text-sidebar/60" : "text-white/40";

    if (isComingSoon) {
      return (
        <div
          key={item.id}
          className={`${baseClass} cursor-not-allowed text-white/40 opacity-60`}
          aria-disabled="true"
          title={label}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          <div className={labelClass}>
            <span className="block truncate">{label}</span>
            {subLabel && <span className="block text-[10px] text-white/40 truncate leading-tight">{subLabel}</span>}
          </div>
          <span className={`text-[10px] font-bold text-white/30 shrink-0 uppercase tracking-wider ${badgeClass}`}>
            Soon
          </span>
        </div>
      );
    }

    const activeClass = isActiveState ? "bg-white text-sidebar shadow-sm" : "text-white/70 hover:text-white hover:bg-white/5";

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={closeMobile}
          aria-current={active ? "page" : undefined}
          className={`${baseClass} ${activeClass}`}
          title={label}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          <div className={labelClass}>
            <span className="block truncate">{label}</span>
            {subLabel && <span className={`block text-[10px] ${subLabelClass} truncate leading-tight`}>{subLabel}</span>}
          </div>
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleAction(item)}
        className={`${baseClass} ${activeClass}`}
        title={label}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <span className={labelClass}>{label}</span>
      </button>
    );
  }

  return (
    <>
      <div
        id="sidebar-overlay"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out lg:hidden"
        onClick={closeMobile}
      />

      <aside
        id="mobile-sidebar"
        style={{
          width: isCompact ? DOCK_WIDTH_COMPACT : DOCK_WIDTH,
          top: "var(--topbar-offset)",
          height: "calc(100vh - var(--topbar-offset))",
        }}
        className="fixed left-0 z-40 bg-sidebar text-white border-r border-white/10 flex flex-col min-h-0 will-change-transform transform -translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100 transition-transform duration-300 ease-in-out"
        data-compact={isCompact ? "true" : "false"}
      >
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-3 pb-6 lg:pb-3">
          {sections.map((section) => {
            const sectionLabel = tSidebar(section.labelKey as Parameters<typeof tSidebar>[0]);
            return (
              <nav key={section.id} aria-label={sectionLabel} className="mb-4">
                <p className={`text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 px-3 mb-2 ${isCompact ? "sr-only" : ""}`}>
                  {sectionLabel}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => renderItem(item))}
                </div>
              </nav>
            );
          })}
        </div>

        <div className="border-t border-white/10 px-2 py-3 space-y-2">
          <nav aria-label={tSidebar(utilitySection.labelKey as Parameters<typeof tSidebar>[0])}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 px-3 mb-2 ${isCompact ? "sr-only" : ""}`}>
              {tSidebar(utilitySection.labelKey as Parameters<typeof tSidebar>[0])}
            </p>
            <div className="space-y-1">
              {utilitySection.items.map((item) => renderItem(item))}
            </div>
          </nav>
          <div className={`flex items-center ${isCompact ? "justify-center" : "justify-start"} gap-2 pt-2`}>
            {modeToggleItems.map((item) => renderItem(item))}
          </div>
        </div>
      </aside>
    </>
  );
}
