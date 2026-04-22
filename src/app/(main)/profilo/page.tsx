"use client";

import { useState, useEffect } from "react";
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
  Pencil,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { CHIESE_LIST } from "@/lib/churches";

export default function ProfiloPage() {
  const t = useTranslations("profilo");
  const { type, user, admin, setShowLoginModal, refresh } = useAuth();

  // Refresh on mount so the profile always reflects the latest DB state
  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* â”€â”€ Password change state â”€â”€ */
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* â”€â”€ Profile edit state (users only) â”€â”€ */
  const [showEditSection, setShowEditSection] = useState(false);
  const [editForm, setEditForm] = useState({ nome: "", cognome: "", email: "", username: "", role: "", ageGroup: "", chiesa: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Admin profile edit state ── */
  const [showAdminEditSection, setShowAdminEditSection] = useState(false);
  const [adminEditForm, setAdminEditForm] = useState({ nome: "", cognome: "", email: "", username: "" });
  const [adminEditLoading, setAdminEditLoading] = useState(false);
  const [adminEditMessage, setAdminEditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* â”€â”€ Admin request state â”€â”€ */
  const [requestingAdmin, setRequestingAdmin] = useState(false);
  const [adminReqMessage, setAdminReqMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* â”€â”€ Guest â”€â”€ */
  if (type === "guest") {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <User className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("titoloGuest")}</h1>
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

  /* â”€â”€ Derived display values â”€â”€ */
  const isAdmin = type === "admin";
  const nome = isAdmin ? (admin?.nome ?? "") : (user?.nome ?? "");
  const cognome = isAdmin ? (admin?.cognome ?? "") : (user?.cognome ?? "");
  const fullName = [nome, cognome].filter(Boolean).join(" ");
  const initials = [nome[0], cognome[0]].filter(Boolean).join("").toUpperCase();
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

  /* â”€â”€ Open edit form (pre-fill) â”€â”€ */
  function openEdit() {
    setEditForm({
      nome: user?.nome ?? "",
      cognome: user?.cognome ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      role: user?.role ?? "",
      ageGroup: user?.ageGroup ?? "",
      chiesa: user?.chiesa ?? "",
    });
    setEditMessage(null);
    setShowEditSection(true);
  }

  function closeEdit() {
    setShowEditSection(false);
    setEditMessage(null);
  }

  /* â”€â”€ Submit profile update â”€â”€ */
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage(null);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editForm.nome,
          cognome: editForm.cognome,
          email: editForm.email,
          username: editForm.username,
          role: editForm.role,
          ageGroup: editForm.ageGroup,
          chiesa: editForm.role === "ospite_chiesa" ? editForm.chiesa : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditMessage({ type: "success", text: t("profiloAggiornato") });
        await refresh();
        setTimeout(closeEdit, 1500);
      } else {
        setEditMessage({ type: "error", text: data.error || t("erroreGenerico") });
      }
    } catch {
      setEditMessage({ type: "error", text: t("erroreGenerico") });
    } finally {
      setEditLoading(false);
    }
  }

  /* â”€â”€ Request admin â”€â”€ */
  async function handleRequestAdmin() {
    setRequestingAdmin(true);
    setAdminReqMessage(null);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestAdmin: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminReqMessage({ type: "success", text: t("richiestaAdminInviata") });
        await refresh();
      } else {
        setAdminReqMessage({ type: "error", text: data.error || t("erroreGenerico") });
      }
    } catch {
      setAdminReqMessage({ type: "error", text: t("erroreGenerico") });
    } finally {
      setRequestingAdmin(false);
    }
  }

  /* â”€â”€ Password change â”€â”€ */
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
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setShowPasswordSection(false);
      } else {
        setPasswordMessage({ type: "error", text: data.error || t("erroreGenerico") });
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
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  }

  /* ── Admin edit handlers ── */
  function openAdminEdit() {
    setAdminEditForm({
      nome: admin?.nome ?? "",
      cognome: admin?.cognome ?? "",
      email: "",
      username: admin?.username ?? "",
    });
    setAdminEditMessage(null);
    setShowAdminEditSection(true);
  }

  function closeAdminEdit() {
    setShowAdminEditSection(false);
    setAdminEditMessage(null);
  }

  async function handleAdminEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdminEditLoading(true);
    setAdminEditMessage(null);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: adminEditForm.nome,
          cognome: adminEditForm.cognome,
          email: adminEditForm.email || undefined,
          username: adminEditForm.username,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminEditMessage({ type: "success", text: t("profiloAggiornato") });
        // Aggiorna localStorage con i nuovi dati admin
        if (data.admin) {
          const stored = localStorage.getItem("admin_info");
          const prev = stored ? JSON.parse(stored) : {};
          localStorage.setItem("admin_info", JSON.stringify({ ...prev, ...data.admin }));
        }
        await refresh();
        setTimeout(closeAdminEdit, 1500);
      } else {
        setAdminEditMessage({ type: "error", text: data.error || t("erroreGenerico") });
      }
    } catch {
      setAdminEditMessage({ type: "error", text: t("erroreGenerico") });
    } finally {
      setAdminEditLoading(false);
    }
  }

  /* ── Render ── */
  return (
    <div className="max-w-2xl space-y-5">

      {/* â”€â”€ Hero card â”€â”€ */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-md ${
          isAdmin
            ? "bg-gradient-to-br from-amber-600 to-amber-700"
            : "bg-gradient-to-br from-primary to-primary-light"
        }`}
      >
        <div aria-hidden className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div aria-hidden className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full opacity-10 bg-white" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-inner bg-white/20 text-white">
            {initials || <User className="w-8 h-8" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {isAdmin && <Crown className="w-4 h-4 text-white/80 flex-shrink-0" />}
              <h1 className="text-xl font-bold truncate">{fullName || "Utente"}</h1>
            </div>
            {username && <p className="text-white/70 text-sm mb-2">@{username}</p>}
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-white/15 border-white/25 text-white">
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* â”€â”€ Info rows â”€â”€ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {email && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("email")}</p>
              <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("ruolo")}</p>
            <p className="text-sm font-medium text-gray-900">{roleDisplay}</p>
          </div>
        </div>
        {username && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("username")}</p>
              <p className="text-sm font-medium text-gray-900">@{username}</p>
            </div>
          </div>
        )}

        {!isAdmin && user?.chiesa && user.role === "ospite_chiesa" && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("chiesaProvenienza")}</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user.chiesa}</p>
            </div>
          </div>
        )}

        {/* Admin request badge */}
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
              {user.adminRequest === "approved" && <Check className="w-3.5 h-3.5" />}
              {user.adminRequest === "pending" && <UserCheck className="w-3.5 h-3.5" />}
              {user.adminRequest === "rejected" && <AlertCircle className="w-3.5 h-3.5" />}
              {t(`adminRequest_${user.adminRequest}` as "adminRequest_approved" | "adminRequest_pending" | "adminRequest_rejected")}
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
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("visitaAdmin")}</p>
                <p className="text-sm font-medium text-gray-900">{t("pannelloAdmin")}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        )}
      </div>

      {/* ── Admin edit profile section ── */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => { showAdminEditSection ? closeAdminEdit() : openAdminEdit(); }}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
            aria-expanded={showAdminEditSection}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Pencil className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("account")}</p>
                <p className="text-sm font-medium text-gray-900">{t("modificaProfilo")}</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAdminEditSection ? "rotate-180" : ""}`}
            />
          </button>

          {showAdminEditSection && (
            <div className="border-t border-gray-100 px-5 py-5">
              <form onSubmit={handleAdminEditSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("nome")}</label>
                    <input
                      type="text"
                      value={adminEditForm.nome}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("cognome")}</label>
                    <input
                      type="text"
                      value={adminEditForm.cognome}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, cognome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={adminEditForm.email}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, email: e.target.value })}
                    autoComplete="email"
                    placeholder={t("emailPlaceholderAdmin")}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("username")}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      value={adminEditForm.username}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, username: e.target.value })}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_.\-]+"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {adminEditMessage && (
                  <div
                    className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
                      adminEditMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {adminEditMessage.type === "success" ? (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    {adminEditMessage.text}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={adminEditLoading}
                    className="px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {adminEditLoading ? t("salvataggioInCorso") : t("salvaModifiche")}
                  </button>
                  <button
                    type="button"
                    onClick={closeAdminEdit}
                    className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t("annulla")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Edit profile section (regular users only) ── */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => { showEditSection ? closeEdit() : openEdit(); }}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
            aria-expanded={showEditSection}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Pencil className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("account")}</p>
                <p className="text-sm font-medium text-gray-900">{t("modificaProfilo")}</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showEditSection ? "rotate-180" : ""}`}
            />
          </button>

          {showEditSection && (
            <div className="border-t border-gray-100 px-5 py-5">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("nome")}</label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("cognome")}</label>
                    <input
                      type="text"
                      value={editForm.cognome}
                      onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("username")}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_.\-]+"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("ruoloComunita")}</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        role: e.target.value,
                        chiesa: e.target.value === "ospite_chiesa" ? editForm.chiesa : "",
                      })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="credente">{t("ruoloCredente")}</option>
                      <option value="madre">{t("ruoloMadre")}</option>
                      <option value="padre">{t("ruoloPadre")}</option>
                      <option value="ospite_chiesa">{t("ruoloOspite")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("fasciaEta")}</label>
                    <select
                      value={editForm.ageGroup}
                      onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="0-11">0–11</option>
                      <option value="12-18">12–18</option>
                      <option value="19-29">19–29</option>
                      <option value="30-45">30–45</option>
                      <option value="46-65">46–65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                </div>

                {editForm.role === "ospite_chiesa" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("chiesaProvenienza")}</label>
                    <select
                      value={editForm.chiesa}
                      onChange={(e) => setEditForm({ ...editForm, chiesa: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Seleziona una chiesa...</option>
                      {CHIESE_LIST.map((chiesa) => (
                        <option key={chiesa} value={chiesa}>
                          {chiesa}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editMessage && (
                  <div
                    className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
                      editMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {editMessage.type === "success" ? (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    {editMessage.text}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    {editLoading ? t("salvataggioInCorso") : t("salvaModifiche")}
                  </button>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t("annulla")}
                  </button>
                </div>
              </form>

              {/* Request admin section (only if not pending/approved) */}
              {(!user?.adminRequest || user.adminRequest === "none" || user.adminRequest === "rejected") && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t("richiediAdmin")}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t("richiediAdminDesc")}</p>
                    </div>
                    <button
                      onClick={handleRequestAdmin}
                      disabled={requestingAdmin}
                      className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      {requestingAdmin ? t("salvataggioInCorso") : t("richiedi")}
                    </button>
                  </div>
                  {adminReqMessage && (
                    <div
                      className={`mt-3 flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
                        adminReqMessage.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {adminReqMessage.type === "success"
                        ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      {adminReqMessage.text}
                    </div>
                  )}
                </div>
              )}

              {/* Already has pending request */}
              {user?.adminRequest === "pending" && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <UserCheck className="w-4 h-4" />
                    {t("adminGiaRichiesto")}
                  </div>
                </div>
              )}

              {/* Approved */}
              {user?.adminRequest === "approved" && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                    <Check className="w-4 h-4" />
                    {t("adminApprovato")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Security / Password section â”€â”€ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => { setShowPasswordSection((prev) => !prev); if (showPasswordSection) closePasswordSection(); }}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors"
          aria-expanded={showPasswordSection}
        >
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t("sicurezza")}</p>
              <p className="text-sm font-medium text-gray-900">{t("cambiaPassword")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-400 tracking-[0.25em]">••••••••</span>
            <Key className={`w-4 h-4 transition-colors ${showPasswordSection ? "text-primary" : "text-gray-400"}`} />
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPasswordSection ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {showPasswordSection && (
          <div className="border-t border-gray-100 px-5 py-5">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("passwordAttuale")}</label>
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("nuovaPassword")}</label>
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("confermaPassword")}</label>
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
