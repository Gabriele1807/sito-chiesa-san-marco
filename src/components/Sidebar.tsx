"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  Info,
  QrCode,
  ChevronRight,
} from "lucide-react";

const navLinks = [
  { href: "/", icon: LayoutDashboard, key: "home" as const, sub: "" },
  { href: "/orari", icon: Clock, key: "orari" as const, sub: "Liturgie settimanali" },
  { href: "/preghiere", icon: BookOpen, key: "preghiere" as const, sub: "Agpeya e celebrazioni" },
  { href: "/icone", icon: ImageIcon, key: "icone" as const, sub: "Con QR code" },
  { href: "/libreria", icon: Library, key: "libreria" as const, sub: "PDF e testi sacri" },
  { href: "/eventi", icon: CalendarDays, key: "eventi" as const, sub: "Calendario" },
];

const infoLinks = [
  { href: "/chi-siamo", icon: Info, key: "chiSiamo" as const, sub: "" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

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

  function renderLink(link: (typeof navLinks)[number]) {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={closeMobile}
        className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${active ? "bg-accent/20 text-accent-light border-l-2 border-accent" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <div className="min-w-0">
          <span className="block truncate">{t(link.key)}</span>
          {link.sub && <span className="block text-[10px] text-gray-500 truncate">{link.sub}</span>}
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
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">
            Navigazione
          </p>
          {navLinks.map(renderLink)}

          <div className="pt-4" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">
            Informazioni
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
              <p className="text-xs font-semibold text-white">Sei in chiesa?</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                Scansiona il QR <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
