"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  Info,
  QrCode,
  ChevronRight,
} from "lucide-react";

// FIX [1] — Sidebar subtitles now use i18n keys instead of hardcoded Italian strings
type NavLink = {
  href: string;
  icon: React.ElementType;
  key: string;
  subKey: string;
};

const navLinks: NavLink[] = [
  { href: "/", icon: Home, key: "home", subKey: "" },
  { href: "/orari", icon: Clock, key: "orari", subKey: "subOrari" },
  { href: "/preghiere", icon: BookOpen, key: "preghiere", subKey: "subPreghiere" },
  { href: "/icone", icon: ImageIcon, key: "icone", subKey: "subIcone" },
  { href: "/libreria", icon: Library, key: "libreria", subKey: "subLibreria" },
  { href: "/eventi", icon: CalendarDays, key: "eventi", subKey: "subEventi" },
];

const infoLinks: NavLink[] = [
  { href: "/chi-siamo", icon: Info, key: "chiSiamo", subKey: "" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ts = useTranslations("sidebar"); // FIX [1] — sidebar-specific translations

  function closeMobile() {
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      overlay.classList.add("hidden");
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function renderLink(link: NavLink) {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={closeMobile}
        className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${active ? "bg-accent/20 text-accent-light border-l-2 border-accent" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <div className="min-w-0">
          <span className="block truncate">{t(link.key as Parameters<typeof t>[0])}</span>
          {/* FIX [1] — Use translated subtitle from sidebar namespace */}
          {link.subKey && <span className="block text-[10px] text-gray-500 truncate">{ts(link.subKey as Parameters<typeof ts>[0])}</span>}
        </div>
      </Link>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        id="sidebar-overlay"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm hidden lg:hidden"
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className="fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-[260px] bg-sidebar text-white transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out lg:sticky lg:top-14 overflow-y-auto flex flex-col"
      >
        {/* Navigation group */}
        <nav className="p-4 space-y-1 flex-1">
          {/* FIX [1] — Section labels now translated */}
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">
            {ts("navigazione")}
          </p>
          {navLinks.map(renderLink)}

          <div className="pt-4" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">
            {ts("informazioni")}
          </p>
          {infoLinks.map(renderLink)}
        </nav>

        {/* QR widget bottom */}
        <div className="p-4 border-t border-white/10">
          <Link href="/icone" onClick={closeMobile} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              {/* FIX [1] — QR widget text translated */}
              <p className="text-xs font-semibold text-white">{ts("seiInChiesa")}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                {ts("scansionaQR")} <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
