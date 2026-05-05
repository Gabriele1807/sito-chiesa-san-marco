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
  Phone,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

// FIX [1] — Sidebar subtitles now use i18n keys instead of hardcoded Italian strings
type NavLink = {
  href: string;
  icon: React.ElementType;
  key: string;
  subKey: string;
  comingSoon?: boolean;
};

const navLinks: NavLink[] = [
  { href: "/", icon: Home, key: "home", subKey: "" },
  { href: "/orari", icon: Clock, key: "orari", subKey: "subOrari" },
  { href: "/preghiere", icon: BookOpen, key: "preghiere", subKey: "subPreghiere" },
  { href: "/icone", icon: ImageIcon, key: "icone", subKey: "subIcone", comingSoon: true },
  { href: "/libreria", icon: Library, key: "libreria", subKey: "subLibreria", comingSoon: true },
  { href: "/eventi", icon: CalendarDays, key: "eventi", subKey: "subEventi", comingSoon: true },
];

const infoLinks: NavLink[] = [
  { href: "/chi-siamo", icon: Info, key: "chiSiamo", subKey: "" },
  { href: "/contatti", icon: Phone, key: "contatti", subKey: "subContatti" },
];

const profileLink: NavLink = {
  href: "/profilo",
  icon: User,
  key: "profilo",
  subKey: "subProfilo",
};

const adminPanelLink: NavLink = {
  href: "/admin",
  icon: Shield,
  key: "pannelloAdmin",
  subKey: "subPannelloAdmin",
};

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ts = useTranslations("sidebar");
  const { type } = useAuth();

  const isAdmin = type === "admin";

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
    const isComingSoon = link.comingSoon && !isAdmin;

    if (isComingSoon) {
      return (
        <div
          key={link.href}
          className="sidebar-link flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium opacity-60 cursor-not-allowed text-white/40"
        >
          <Icon className="w-4.5 h-4.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="block truncate">{t(link.key as Parameters<typeof t>[0])}</span>
            {link.subKey && <span className="block text-[10px] text-gray-600 truncate leading-tight">{ts(link.subKey as Parameters<typeof ts>[0])}</span>}
          </div>
          <span className="text-[10px] font-bold text-white/30 shrink-0 uppercase tracking-wider">Soon</span>
        </div>
      );
    }

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={closeMobile}
        className={`sidebar-link flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${active ? "bg-accent/20 text-accent border-l-2 border-accent" : "text-white/70 hover:text-white hover:bg-white/5"}`}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" />
        <div className="min-w-0">
          <span className="block truncate">{t(link.key as Parameters<typeof t>[0])}</span>
          {link.subKey && <span className="block text-[10px] text-white/40 truncate leading-tight">{ts(link.subKey as Parameters<typeof ts>[0])}</span>}
        </div>
      </Link>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        id="sidebar-overlay"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm hidden lg:hidden"
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className="fixed top-[56px] left-0 z-40 h-[calc(100vh-56px)] w-[240px] bg-sidebar text-white border-r border-white/10 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out lg:sticky lg:top-[88px] lg:h-auto lg:min-h-[calc(100vh-88px)] overflow-y-auto lg:overflow-visible flex flex-col"
      >
        {/* Navigation group */}
        <nav className="p-3 space-y-0.5 flex-1">
          {/* FIX [1] — Section labels now translated */}
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2.5">
            {ts("navigazione")}
          </p>
          {navLinks.map(renderLink)}

          <div className="pt-3" />
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2.5">
            {ts("informazioni")}
          </p>
          {infoLinks.map(renderLink)}
          {type !== "guest" && (
            <>
              {renderLink(profileLink)}
              {type === "admin" && renderLink(adminPanelLink)}
            </>
          )}
        </nav>

        {/* QR widget bottom - Only for admins */}
        {isAdmin && (
          <div className="p-3 border-t border-white/10">
            <Link href="/icone" onClick={closeMobile} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <QrCode className="w-4.5 h-4.5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{ts("seiInChiesa")}</p>
                <p className="text-[10px] text-white/50 flex items-center gap-0.5">
                  {ts("scansionaQR")} <ChevronRight className="w-3 h-3" />
                </p>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
