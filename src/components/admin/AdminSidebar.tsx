"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Image as ImageIcon,
  Clock,
  CalendarDays,
  BookOpen,
  FolderLock,
  ArrowLeft,
  LogOut,
  Users,
  UsersRound,
} from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/libreria", label: "Gestione Libreria", icon: Library },
  { href: "/admin/icone", label: "Gestione Icone", icon: ImageIcon },
  { href: "/admin/orari", label: "Gestione Orari", icon: Clock },
  { href: "/admin/eventi", label: "Gestione Eventi", icon: CalendarDays },
  { href: "/admin/preghiere", label: "Gestione Preghiere", icon: BookOpen },
  { href: "/admin/libreria-privata", label: "Libreria Privata", icon: FolderLock },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    nome: string;
    cognome: string;
    ruolo: string;
  } | null>(null);

  useEffect(() => {
    // Legge le info admin dal localStorage (salvate al login)
    // Si aggiorna ad ogni cambio di pathname per rilevare subito il ruolo dopo il login
    try {
      const stored = localStorage.getItem("admin_info");
      if (stored) {
        setAdminInfo(JSON.parse(stored));
      }
    } catch {
      // ignora
    }
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    localStorage.removeItem("admin_info");
    router.push("/");
  }

  function closeMobile() {
    const sidebar = document.getElementById("admin-mobile-sidebar");
    const overlay = document.getElementById("admin-sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      overlay.classList.add("hidden");
    }
  }

  const isSuperAdmin = adminInfo?.ruolo === "superadmin";

  return (
    <>
      {/* Mobile overlay */}
      <div
        id="admin-sidebar-overlay"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm hidden lg:hidden"
        onClick={closeMobile}
      />

      <aside
        id="admin-mobile-sidebar"
        className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#0F1A2E] text-white flex flex-col z-50 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out"
      >
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">☦</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Pannello Admin</p>
            <p className="text-[10px] text-gray-400">San Marco – Milano</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-amber-600/20 text-amber-600 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {link.label}
            </Link>
          );
        })}

        {/* Solo superadmin: gestione admin */}
        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Amministrazione
              </p>
            </div>
            <Link
              href="/admin/utenti"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                pathname === "/admin/utenti"
                  ? "bg-amber-600/20 text-amber-600 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <UsersRound className="w-4.5 h-4.5" />
              Gestione Utenti
            </Link>
            <Link
              href="/admin/gestione-admin"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                pathname === "/admin/gestione-admin"
                  ? "bg-amber-600/20 text-amber-600 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              Gestione Admin
            </Link>
          </>
        )}
      </nav>

      {/* Bottom: user info + actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        {/* User info */}
        {adminInfo && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                isSuperAdmin ? "bg-amber-500" : "bg-blue-500"
              }`}
            >
              {adminInfo.nome[0]}{adminInfo.cognome[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {adminInfo.nome} {adminInfo.cognome}
              </p>
              <p className="text-[10px] text-gray-400">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/"
          onClick={closeMobile}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          Torna al sito
        </Link>
        {/* FIX [14] — Logout separated with divider, red styling distinct from active links */}
        <div className="border-t border-white/10 mt-2 pt-2">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all w-full cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            {loggingOut ? "Uscita..." : "Logout"}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
