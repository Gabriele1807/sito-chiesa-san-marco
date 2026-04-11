"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, UserX, LogOut, Shield, ChevronDown, UserCircle } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function UserMenu() {
  const { type, loading, user, admin, isExplicitGuest, setShowLoginModal, setShowRegisterModal, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  // Ospite esplicito: mostra indicatore ospite con possibilità di accedere
  if (type === "guest" && isExplicitGuest) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-lg">
          <UserX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ospite</span>
        </div>
        <button
          onClick={() => setShowLoginModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-light transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Accedi</span>
        </button>
      </div>
    );
  }

  // Guest non esplicito: bottoni login + registrazione
  if (type === "guest") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowLoginModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-light transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Accedi</span>
        </button>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-white border border-primary rounded-lg hover:bg-primary/5 transition-colors"
        >
          <span className="hidden sm:inline">Registrati</span>
        </button>
      </div>
    );
  }

  // Utente autenticato (normale o admin)
  const displayName = type === "admin" && admin
    ? `${admin.nome} ${admin.cognome}`
    : type === "user" && user
    ? `${user.nome} ${user.cognome}`
    : "Utente";

  const initials = type === "admin" && admin
    ? `${admin.nome[0]}${admin.cognome[0]}`
    : type === "user" && user
    ? `${user.nome[0]}${user.cognome[0]}`
    : "U";

  const isAdmin = type === "admin";

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg transition-colors hover:bg-gray-100 px-2 py-1"
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            isAdmin ? "bg-amber-500" : "bg-primary"
          }`}
        >
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500">
              {isAdmin && admin
                ? admin.ruolo === "superadmin" ? "Super Admin" : "Admin"
                : user?.role === "credente" ? "Credente"
                : user?.role === "madre" ? "Madre"
                : user?.role === "padre" ? "Padre"
                : user?.role === "ospite_chiesa" ? "Ospite"
                : "Utente"}
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Pannello Admin
            </Link>
          )}

          <Link
            href="/profilo"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="w-4 h-4" />
            Il mio profilo
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
