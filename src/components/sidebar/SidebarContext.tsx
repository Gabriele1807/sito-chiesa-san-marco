"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  isCompact: boolean;
  toggleCompact: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("dock_compact") === "true";
    setIsCompact(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--dock-width", isCompact ? "72px" : "240px");

    if (typeof window !== "undefined") {
      window.localStorage.setItem("dock_compact", isCompact ? "true" : "false");
    }
  }, [isCompact]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldLockBody = isMobileOpen && window.innerWidth < 1024;
    document.body.style.overflow = shouldLockBody ? "hidden" : "";

    if (!isMobileOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen]);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), []);
  const toggleCompact = useCallback(() => setIsCompact((prev) => !prev), []);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isMobileOpen,
      openMobile,
      closeMobile,
      toggleMobile,
      isCompact,
      toggleCompact,
    }),
    [closeMobile, isCompact, isMobileOpen, openMobile, toggleCompact, toggleMobile]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside a SidebarProvider");
  }
  return context;
}
