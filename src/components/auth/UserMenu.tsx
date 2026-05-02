"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, UserX, UserPlus, LogOut, Shield, ChevronDown, UserCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useTranslations } from "next-intl";

export default function UserMenu() {
  const t = useTranslations("auth");
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
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-foreground/60 bg-surface border border-border rounded-lg">
          <UserX className="w-3.5 h-3.5" />
          <span>{t("userMenuGuest")}</span>
        </div>
        <button
          onClick={() => setShowLoginModal(true)}
          className="btn-primary text-xs"
        >
          <User className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span>{t("userMenuLogin")}</span>
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
          className="btn-primary text-xs"
        >
          <User className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span>{t("userMenuLogin")}</span>
        </button>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn-secondary text-xs hidden sm:inline-flex"
        >
          <UserPlus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span>{t("userMenuRegister")}</span>
        </button>
      </div>
    );
  }

  // Utente autenticato (normale o admin)
  const displayName = type === "admin" && admin
    ? `${admin.nome} ${admin.cognome}`
    : type === "user" && user
    ? `${user.nome} ${user.cognome}`
    : t("userMenuUser");

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
        className="flex items-center gap-1.5 rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-100 px-1.5 py-1"
        aria-expanded={open}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ${
            isAdmin ? "bg-[#D97706] ring-[#D97706]/30" : "bg-[#0F1A2E] ring-[#0F1A2E]/20"
          }`}
        >
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-scaleIn origin-top-right">
          <div className="px-4 py-2 border-b border-gray-100 animate-fadeInUp stagger-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500">
              {isAdmin && admin
                ? admin.ruolo === "superadmin" ? t("userMenuRoleSuperAdmin") : t("userMenuRoleAdmin")
                : user?.role === "credente" ? t("userMenuRoleCredente")
                : user?.role === "madre" ? t("userMenuRoleMadre")
                : user?.role === "padre" ? t("userMenuRolePadre")
                : user?.role === "ospite_chiesa" ? t("userMenuRoleOspite")
                : t("userMenuUser")}
            </p>
          </div>

          <Link
            href="/profilo"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors animate-fadeInUp stagger-2"
          >
            <UserCircle className="w-4 h-4" />
            {t("userMenuProfile")}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#D97706] hover:bg-[#D97706]/10 transition-colors animate-fadeInUp stagger-3"
            >
              <Shield className="w-4 h-4" />
              {t("userMenuAdminPanel")}
            </Link>
          )}

          <div className="border-t border-gray-100 mt-1 pt-1 animate-fadeInUp stagger-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            {t("userMenuLogout")}
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
