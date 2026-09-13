"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Shield, ChevronDown, UserCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useTranslations } from "next-intl";

export default function UserMenu() {
  const t = useTranslations("auth");
  const { type, loading, user, admin, logout } = useAuth();
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
      <div className="w-8 h-8 rounded-full bg-surface-2 animate-pulse" />
    );
  }

  if (type === "guest") {
    return null;
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
        className="flex items-center gap-1.5 rounded-lg transition-colors hover:bg-surface-2 active:bg-surface-2 px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ${
            isAdmin ? "bg-gold-light ring-gold-light/30" : "bg-primary ring-primary/20"
          }`}
        >
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-xl border border-border py-2 z-50 animate-scaleIn origin-top-right">
          <div className="px-4 py-2 border-b border-border animate-fadeInUp stagger-1">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-foreground/60">
              {isAdmin && admin
                ? admin.ruolo === "superadmin" ? t("userMenuRoleSuperAdmin") : t("userMenuRoleAdmin")
                : user?.role === "credente" ? t("userMenuRoleCredente")
                : user?.role === "madre" ? t("userMenuRoleMadre")
                : user?.role === "padre" ? t("userMenuRolePadre")
                : user?.role === "ospite_chiesa" ? t("userMenuRoleOspite")
                : user?.role === "prete" ? t("userMenuRolePrete")
                : t("userMenuUser")}
            </p>
          </div>

          <Link
            href="/profilo"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:bg-surface-2 transition-colors animate-fadeInUp stagger-2"
          >
            <UserCircle className="w-4 h-4" />
            {t("userMenuProfile")}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gold-light hover:bg-gold-light/10 transition-colors animate-fadeInUp stagger-3"
            >
              <Shield className="w-4 h-4" />
              {t("userMenuAdminPanel")}
            </Link>
          )}

          <div className="border-t border-border mt-1 pt-1 animate-fadeInUp stagger-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors w-full text-left"
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
