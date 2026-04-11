"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Mail,
  Shield,
  Key,
  Check,
  AlertCircle,
  ChevronDown,
  Lock,
  UserCheck,
  Crown,
  ArrowRight,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

export default function ProfiloPage() {
  const t = useTranslations("profilo");
  const { type, user, admin, setShowLoginModal } = useAuth();

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ── Guest ── */
  if (type === "guest") {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <User className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("titoloGuest")}
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm">{t("messaggioGuest")}</p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm"
        >
          <User className="w-4 h-4" />
          {t("accedi")}
        </button>
      </div>
    );
  }

  /* ── Derived display values (works for both user and admin) ── */
  const isAdmin = type === "admin";
  const nome = isAdmin ? (admin?.nome ?? "") : (user?.nome ?? "");
  const cognome = isAdmin ? (admin?.cognome ?? "") : (user?.cognome ?? "");
  const fullName = [nome, cognome].filter(Boolean).join(" ");
  const initials = [nome[0], cognome[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();
  const username = isAdmin ? admin?.username : user?.username;
  const email = isAdmin ? null : user?.email;

  const roleLabels: Record<string, string> = {
    credente: t("ruoloCredente"),
    madre: t("ruoloMadre"),
    padre: t("ruoloPadre"),
    ospite_chiesa: t("ruoloOspite"),
    admin: t("ruoloAdmin"),
    superadmin: t("ruoloSuperAdmin"),
  };
  const roleDisplay = isAdmin
    ? roleLabels[admin?.ruolo ?? "admin"] ?? t("ruoloAdmin")
    : roleLabels[user?.role ?? ""] ?? user?.role ?? "";

  /* ── Password change ── */
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: t("passwordNonCoincidono") });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: t("passwordTroppoCorta") });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMessage({ type: "success", text: t("passwordCambiata") });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      } else {
        setPasswordMessage({
          type: "error",
          text: data.error || t("erroreGenerico"),
        });
      }
    } catch {
      setPasswordMessage({ type: "error", text: t("erroreGenerico") });
    } finally {
      setPasswordLoading(false);
    }
  }

  function closePasswordSection() {
    setShowPasswordSection(false);
    setPasswordMessage(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  /* ── Render ── */
  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Hero card ── */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-md ${
          isAdmin
            ? "bg-gradient-to-br from-amber-600 to-amber-700"
            : "bg-gradient-to-br from-primary to-primary-light"
        }`}
      >
        {/* Decorative cross watermark */}
        <div
          aria-hidden
          className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-10 bg-white"
        />
        <div
          aria-hidden
          className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full opacity-10 bg-white"
        />

        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-inner ${
              isAdmin
                ? "bg-white/20 text-white"
                : "bg-white/15 text-white"
            }`}
          >
            {initials || <User className="w-8 h-8" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {isAdmin && (
                <Crown className="w-4 h-4 text-white/80 flex-shrink-0" />
              )}
              <h1 className="text-xl font-bold truncate">
                {fullName || "Utente"}
              </h1>
            </div>
            {username && (
              <p className="text-white/70 text-sm mb-2">@{username}</p>
            )}
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isAdmin
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/15 border-white/25 text-white"
              }`}
            >
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* ── Info rows ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {/* Email */}
        {email && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                {t("email")}
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {email}
              </p>
            </div>
          </div>
        )}

        {/* Role */}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
              {t("ruolo")}
            </p>
            <p className="text-sm font-medium text-gray-900">{roleDisplay}</p>
          </div>
        </div>

        {/* Username */}
        {username && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                {t("username")}
              </p>
              <p className="text-sm font-medium text-gray-900">@{username}</p>
            </div>
          </div>
        )}

        {/* Admin request status (regular users only) */}
        {!isAdmin && user?.adminRequest && user.adminRequest !== "none" && (
          <div className="px-5 py-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                user.adminRequest === "approved"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : user.adminRequest === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {user.adminRequest === "approved" && (
                <Check className="w-3.5 h-3.5" />
              )}
              {user.adminRequest === "pending" && (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              {user.adminRequest === "rejected" && (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {t(
                `adminRequest_${user.adminRequest}` as
                  | "adminRequest_approved"
                  | "adminRequest_pending"
                  | "adminRequest_rejected"
              )}
            </div>
          </div>
        )}

        {/* Admin panel link */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                  {t("visitaAdmin")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {t("pannelloAdmin")}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        )}
      </div>

      {/* ── Security / Password section (collapsible) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => {
            setShowPasswordSection((prev) => !prev);
            if (showPasswordSection) closePasswordSection();
          }}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
          aria-expanded={showPasswordSection}
        >
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                {t("sicurezza")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {t("cambiaPassword")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-400 tracking-[0.25em]">
              ••••••••
            </span>
            <Key
              className={`w-4 h-4 transition-colors ${showPasswordSection ? "text-primary" : "text-gray-400"}`}
            />
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPasswordSection ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {showPasswordSection && (
          <div className="border-t border-gray-100 px-5 py-5">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {t("passwordAttuale")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t("nuovaPassword")}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t("confermaPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
                    passwordMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? t("salvataggioInCorso") : t("salvaPassword")}
                </button>
                <button
                  type="button"
                  onClick={closePasswordSection}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t("annulla")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
