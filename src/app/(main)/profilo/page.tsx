"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  CalendarDays,
  Image as ImageIcon,
  Library,
  BookOpen,
  Users,
  Key,
  Check,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Lock,
  UserCheck,
  Crown,
  Eye,
  EyeOff,
  ArrowRight,
  Settings,
  Pencil,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { CHIESE_LIST } from "@/lib/churches";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import LinkedAccountsSection from "@/components/profile/LinkedAccountsSection";

export default function ProfiloPage() {
  const t = useTranslations("profilo");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tIscrizioni = useTranslations("iscrizioni");
  const router = useRouter();
  const { type, user, admin, setShowLoginModal, refresh, logout } = useAuth();

  function getRegistrationTypeInfo(
    type?: "self" | "other" | "family"
  ): { label: string; icon: string; classes: string } {
    switch (type) {
      case "other":
        return { label: tIscrizioni("iscrizionePerAltro"), icon: "👤", classes: "bg-primary/10 text-primary" };
      case "family":
        return { label: tIscrizioni("iscrizionePerFamiglia"), icon: "👨‍👩‍👧", classes: "bg-surface-2 text-foreground/70" };
      default:
        return { label: tIscrizioni("iscrizionePerMe"), icon: "🙋", classes: "bg-accent/15 text-accent" };
    }
  }

  // Refresh on mount so the profile always reflects the latest DB state
  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── OAuth linked-account success banner (?linked=<provider>) ── */
  const [linkedMessage, setLinkedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const linkedProvider = params.get("linked");
    if (!linkedProvider) return;

    const providerLabel = linkedProvider.charAt(0).toUpperCase() + linkedProvider.slice(1);
    setLinkedMessage({ type: "success", text: t("linkedAccountsSuccess", { provider: providerLabel }) });

    const url = new URL(window.location.href);
    url.searchParams.delete("linked");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* â”€â”€ Password change state â”€â”€ */
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const passwordRules = validatePasswordRules(newPassword);
  const passwordRequirementItems = [
    { key: "length", label: tAuth("registerPasswordRuleLength"), ok: passwordRules.length },
    { key: "lowercase", label: tAuth("registerPasswordRuleLowercase"), ok: passwordRules.lowercase },
    { key: "uppercase", label: tAuth("registerPasswordRuleUppercase"), ok: passwordRules.uppercase },
    { key: "number", label: tAuth("registerPasswordRuleNumber"), ok: passwordRules.number },
    { key: "special", label: tAuth("registerPasswordRuleSpecial"), ok: passwordRules.special },
  ] as const;

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

  /* ── Admin request state ── */
  const [requestingAdmin, setRequestingAdmin] = useState(false);
  const [adminReqMessage, setAdminReqMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Iscrizioni state ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [iscrizioni, setIscrizioni] = useState<any[]>([]);
  const [iscrizioniLoading, setIscrizioniLoading] = useState(true);
  const [iscrizioniError, setIscrizioniError] = useState(false);

  useEffect(() => {
    if (type !== "guest") {
      fetch("/api/auth/iscrizioni")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIscrizioni(data.iscrizioni);
          } else {
            setIscrizioniError(true);
          }
        })
        .catch(() => setIscrizioniError(true))
        .finally(() => setIscrizioniLoading(false));
    }
  }, [type]);

  /* â”€â”€ Guest â”€â”€ */
  if (type === "guest") {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-5">
          <User className="w-10 h-10 text-foreground/30" />
        </div>
        <h1 className="font-display text-2xl text-foreground mb-2">{t("titoloGuest")}</h1>
        <p className="text-foreground/60 mb-8 max-w-sm">{t("messaggioGuest")}</p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="btn-primary"
        >
          <User className="w-4 h-4" />
          {t("accedi")}
        </button>
      </div>
    );
  }

  /* â”€â”€ Derived display values â”€â”€ */
  const isAdmin = type === "admin";
  const isSuperAdmin = isAdmin && admin?.ruolo === "superadmin";
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
    prete: t("ruoloPrete"),
    admin: t("ruoloAdmin"),
    superadmin: t("ruoloSuperAdmin"),
  };
  const roleDisplay = isAdmin
    ? roleLabels[admin?.ruolo ?? "admin"] ?? t("ruoloAdmin")
    : roleLabels[user?.role ?? ""] ?? user?.role ?? "";

  const adminRequestTone =
    user?.adminRequest === "approved"
      ? "border-success/20 bg-success/10 text-success"
      : user?.adminRequest === "pending"
        ? "border-gold/30 bg-gold/5 text-gold"
        : user?.adminRequest === "rejected"
          ? "border-danger/20 bg-danger/10 text-danger"
          : "border-border bg-surface-2 text-foreground/70";

  const adminRequestSummary =
    user?.adminRequest === "approved"
      ? t("adminApprovato")
      : user?.adminRequest === "pending"
        ? t("adminGiaRichiesto")
        : user?.adminRequest === "rejected"
          ? t("adminRequest_rejected")
          : t("nessunaRichiestaAdmin");

  const siteQuickActions = [
    { href: "/eventi", label: t("azioneSitoEventi"), icon: CalendarDays, tone: "bg-accent/10 text-accent" },
    { href: "/icone", label: t("azioneSitoIcone"), icon: ImageIcon, tone: "bg-primary/10 text-primary" },
    { href: "/preghiere", label: t("azioneSitoPreghiere"), icon: BookOpen, tone: "bg-accent/10 text-accent" },
    { href: "/libreria", label: t("azioneSitoLibreria"), icon: Library, tone: "bg-primary/10 text-primary" },
  ];

  const adminQuickActions = isSuperAdmin
    ? [
        { href: "/admin/gestione-admin", label: t("azioneSuperAdminGestioneAdmin"), icon: Shield, prominent: true },
        { href: "/admin/utenti", label: t("azioneSuperAdminUtenti"), icon: Users, prominent: true },
        { href: "/admin/eventi", label: t("azioneAdminEvento"), icon: CalendarDays, prominent: false },
        { href: "/admin/icone", label: t("azioneAdminIcona"), icon: ImageIcon, prominent: false },
      ]
    : [
        { href: "/admin/eventi", label: t("azioneAdminEvento"), icon: CalendarDays, prominent: false },
        { href: "/admin/icone", label: t("azioneAdminIcona"), icon: ImageIcon, prominent: false },
        { href: "/admin/preghiere", label: t("azioneAdminPreghiera"), icon: BookOpen, prominent: false },
        { href: "/admin/libreria", label: t("azioneAdminLibreria"), icon: Library, prominent: false },
      ];

  const superAdminRequest = admin?.superAdminRequest ?? "none";
  const superAdminRequestTone =
    superAdminRequest === "approved"
      ? "border-success/20 bg-success/10 text-success"
      : superAdminRequest === "pending"
        ? "border-gold/20 bg-gold/10 text-gold"
        : superAdminRequest === "rejected"
          ? "border-danger/20 bg-danger/10 text-danger"
          : "border-border bg-surface-2 text-foreground/70";

  const superAdminRequestSummary =
    superAdminRequest === "approved"
      ? t("superAdminApprovato")
      : superAdminRequest === "pending"
        ? t("superAdminGiaRichiesto")
        : superAdminRequest === "rejected"
          ? t("superAdminRequest_rejected")
          : t("nessunaRichiestaSuperAdmin");

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
    if (Object.values(passwordRules).some((rule) => !rule)) {
      setPasswordMessage({ type: "error", text: t("passwordErrorRules") });
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
        setShowPassword(false);
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
    setShowPassword(false);
  }

  async function handleLogoutFromProfile() {
    await logout();
    router.push("/");
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
    <div className="mx-auto max-w-7xl">
      <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)] 2xl:gap-8">
        <div className="min-w-0 space-y-5">

      {/* â”€â”€ Hero card â”€â”€ */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 text-white shadow-md ${
          isAdmin
            ? "bg-gradient-to-br from-gold to-gold-light"
            : "bg-gradient-to-br from-primary to-primary-light"
        }`}
      >
        <div aria-hidden className="texture-lattice pointer-events-none absolute inset-0 text-white/[0.06]" />
        <div className="relative flex items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 border border-white/30 bg-surface/10 text-white">
            {initials || <User className="w-8 h-8" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {isAdmin && <Crown className="w-4 h-4 text-white/80 flex-shrink-0" />}
              <h1 className="font-display text-xl truncate">{fullName || "Utente"}</h1>
            </div>
            {username && <p className="text-white/70 text-sm mb-2">@{username}</p>}
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-surface/15 border-white/25 text-white">
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>

      {linkedMessage && (
        <div
          className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
            linkedMessage.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-danger/10 text-danger border border-danger/20"
          }`}
        >
          {linkedMessage.type === "success" ? (
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          {linkedMessage.text}
        </div>
      )}

      {/* â”€â”€ Info rows â”€â”€ */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
        {email && (
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("email")}</p>
              <p className="text-sm font-medium text-foreground truncate">{email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("ruolo")}</p>
            <p className="text-sm font-medium text-foreground">{roleDisplay}</p>
          </div>
        </div>
        {username && (
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-foreground/60" />
            </div>
            <div>
              <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("username")}</p>
              <p className="text-sm font-medium text-foreground">@{username}</p>
            </div>
          </div>
        )}

        {!isAdmin && user?.chiesa && user.role === "ospite_chiesa" && (
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("chiesaProvenienza")}</p>
              <p className="text-sm font-medium text-foreground truncate">{user.chiesa}</p>
            </div>
          </div>
        )}

        {/* Admin request badge */}
        {!isAdmin && user?.adminRequest && user.adminRequest !== "none" && (
          <div className="px-5 py-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                user.adminRequest === "approved"
                  ? "bg-success/10 text-success border border-success/20"
                  : user.adminRequest === "pending"
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "bg-danger/10 text-danger border border-danger/20"
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
            className="flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("visitaAdmin")}</p>
                <p className="text-sm font-medium text-foreground">{t("pannelloAdmin")}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground transition-colors" />
          </Link>
        )}
      </div>

      {/* ── Admin edit profile section ── */}
      {isAdmin && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => {
              if (showAdminEditSection) {
                closeAdminEdit();
              } else {
                openAdminEdit();
              }
            }}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-surface-2 transition-colors"
            aria-expanded={showAdminEditSection}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Pencil className="w-4 h-4 text-gold" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("account")}</p>
                <p className="text-sm font-medium text-foreground">{t("modificaProfilo")}</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${showAdminEditSection ? "rotate-180" : ""}`}
            />
          </button>

          {showAdminEditSection && (
            <div className="border-t border-border px-5 py-5">
              <form onSubmit={handleAdminEditSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("nome")}</label>
                    <input
                      type="text"
                      value={adminEditForm.nome}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("cognome")}</label>
                    <input
                      type="text"
                      value={adminEditForm.cognome}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, cognome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={adminEditForm.email}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, email: e.target.value })}
                    autoComplete="email"
                    placeholder={t("emailPlaceholderAdmin")}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("username")}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 text-sm">@</span>
                    <input
                      type="text"
                      value={adminEditForm.username}
                      onChange={(e) => setAdminEditForm({ ...adminEditForm, username: e.target.value })}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_.\-]+"
                      className="w-full pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>

                {adminEditMessage && (
                  <div
                    className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
                      adminEditMessage.type === "success"
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-danger/10 text-danger border border-danger/20"
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={adminEditLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gold text-white text-sm font-semibold rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50"
                  >
                    {adminEditLoading ? t("salvataggioInCorso") : t("salvaModifiche")}
                  </button>
                  <button
                    type="button"
                    onClick={closeAdminEdit}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
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
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => {
              if (showEditSection) {
                closeEdit();
              } else {
                openEdit();
              }
            }}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-surface-2 transition-colors"
            aria-expanded={showEditSection}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Pencil className="w-4 h-4 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("account")}</p>
                <p className="text-sm font-medium text-foreground">{t("modificaProfilo")}</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${showEditSection ? "rotate-180" : ""}`}
            />
          </button>

          {showEditSection && (
            <div className="border-t border-border px-5 py-5">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("nome")}</label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("cognome")}</label>
                    <input
                      type="text"
                      value={editForm.cognome}
                      onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("username")}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 text-sm">@</span>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_.\-]+"
                      className="w-full pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("ruoloComunita")}</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        role: e.target.value,
                        chiesa: e.target.value === "ospite_chiesa" ? editForm.chiesa : "",
                      })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    >
                      <option value="credente">{t("ruoloCredente")}</option>
                      <option value="madre">{t("ruoloMadre")}</option>
                      <option value="padre">{t("ruoloPadre")}</option>
                      <option value="ospite_chiesa">{t("ruoloOspite")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("fasciaEta")}</label>
                    <select
                      value={editForm.ageGroup}
                      onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
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
                    <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">{t("chiesaProvenienza")}</label>
                    <select
                      value={editForm.chiesa}
                      onChange={(e) => setEditForm({ ...editForm, chiesa: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
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
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-danger/10 text-danger border border-danger/20"
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    {editLoading ? t("salvataggioInCorso") : t("salvaModifiche")}
                  </button>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {t("annulla")}
                  </button>
                </div>
              </form>

              {/* Request admin section (only if not pending/approved) */}
              {(!user?.adminRequest || user.adminRequest === "none" || user.adminRequest === "rejected") && (
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("richiediAdmin")}</p>
                      <p className="text-xs text-foreground/60 mt-0.5">{t("richiediAdminDesc")}</p>
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
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20"
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
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gold/10 text-gold border border-gold/20">
                    <UserCheck className="w-4 h-4" />
                    {t("adminGiaRichiesto")}
                  </div>
                </div>
              )}

              {/* Approved */}
              {user?.adminRequest === "approved" && (
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-success/10 text-success border border-success/20">
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
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => { setShowPasswordSection((prev) => !prev); if (showPasswordSection) closePasswordSection(); }}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-surface-2 transition-colors"
          aria-expanded={showPasswordSection}
        >
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-foreground/60" />
            </div>
            <div className="text-left">
              <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("sicurezza")}</p>
              <p className="text-sm font-medium text-foreground">{t("cambiaPassword")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-foreground/40 tracking-[0.25em]">••••••••</span>
            <Key className={`w-4 h-4 transition-colors ${showPasswordSection ? "text-primary" : "text-foreground/40"}`} />
            <ChevronDown
              className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${showPasswordSection ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {showPasswordSection && (
          <div className="border-t border-border px-5 py-5">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("passwordAttuale")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2 rounded-2xl border border-border bg-background/50 text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                      {tAuth("registerFieldPassword")}
                    </label>
                    <span className="text-[11px] text-foreground/60">{tAuth("registerPasswordRequirementsTitle")}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordMessage?.type === "error") setPasswordMessage(null);
                      }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 rounded-2xl border border-border bg-background/50 text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-foreground/60">{tAuth("registerPasswordHintSpecial")}</div>
                  <div className="mt-3 grid gap-2 text-sm text-foreground/60">
                    {passwordRequirementItems.map((rule) => {
                      const Icon = rule.ok ? CheckCircle : XCircle;
                      return (
                        <div key={rule.key} className="flex items-center gap-2" style={{ transition: "color 200ms ease, opacity 200ms ease" }}>
                          <Icon className={`w-4 h-4 shrink-0 transition-all duration-200 ${rule.ok ? "text-success scale-100 opacity-100" : "text-danger scale-95 opacity-80"}`} />
                          <span className={`text-xs ${rule.ok ? "text-success" : "text-danger"}`} style={{ transition: "color 200ms ease, opacity 200ms ease" }}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">
                    {tAuth("registerFieldPasswordConfirm")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 rounded-2xl border border-border bg-background/50 text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword ? (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {newPassword === confirmPassword ? (
                        <>
                          <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                          <span className="text-success">{tAuth("registerPasswordMatchOk")}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 shrink-0 text-danger" />
                          <span className="text-danger">{tAuth("registerPasswordMatchMismatch")}</span>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
                    passwordMessage.type === "success"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-danger/10 text-danger border border-danger/20"
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? t("salvataggioInCorso") : t("salvaPassword")}
                </button>
                <button
                  type="button"
                  onClick={closePasswordSection}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  {t("annulla")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Linked accounts section (regular users only) ── */}
      {type === "user" && <LinkedAccountsSection />}

      {/* ── Iscrizioni section ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wide mb-0.5">{t("azioniSitoTitle")}</p>
              <p className="text-sm font-medium text-foreground">{t("leTueIscrizioni")}</p>
            </div>
          </div>
          <div className="px-5 py-5">
            {iscrizioniLoading ? (
              <p className="text-sm text-foreground/60">{t("loadingIscrizioni")}</p>
            ) : iscrizioniError ? (
              <p className="text-sm text-danger">{t("erroreIscrizioni")}</p>
            ) : iscrizioni.length === 0 ? (
              <p className="text-sm text-foreground/60">{t("nessunaIscrizione")}</p>
            ) : (
              <ul className="space-y-3">
                {iscrizioni.map((isc, idx) => {
                  const registrationType = isc.registrationType ?? "self";
                  const registrationTypeInfo = getRegistrationTypeInfo(registrationType);

                  return (
                    <li key={idx} className="p-3 border border-border rounded-xl bg-surface-2/50">
                      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{isc.eventoTitolo}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${registrationTypeInfo.classes} text-xs font-semibold flex-shrink-0`}>
                          {registrationTypeInfo.icon} {registrationTypeInfo.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-foreground/60">
                        <span>{isc.eventoData ? new Date(isc.eventoData).toLocaleDateString() : ""}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span>{tIscrizioni("partecipante")}:{" "}{isc.nome} {isc.cognome}</span>
                      </div>
                      
                      {registrationType === "family" && isc.familyMembers && isc.familyMembers.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border space-y-1">
                          <p className="text-xs font-semibold text-foreground/70">{tIscrizioni("componentiFamiglia")}:</p>
                          <div className="text-xs text-foreground/70 space-y-0.5">
                            {isc.familyMembers.map((member: { role: string; fullName: string }, memberIdx: number) => (
                              <div key={memberIdx} className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                                  {member.role === "madre" ? "👩" : member.role === "padre" ? "👨" : "👧"}
                                </span>
                                <span>{member.fullName} <span className="text-foreground/40">({member.role})</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      <div className="rounded-2xl border border-danger/20 bg-surface p-5 shadow-sm">
        <button
          type="button"
          onClick={handleLogoutFromProfile}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/15 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {tAuth("userMenuLogout")}
        </button>
      </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20">

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">{t("azioniRapide")}</p>

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">{t("azioniSitoTitle")}</p>
              <div className="mt-2 space-y-2">
                {siteQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex w-full items-center justify-between rounded-xl border border-border px-3.5 py-3 text-left transition-colors hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-foreground/40 transition-colors group-hover:text-foreground" />
                    </Link>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
                    {isSuperAdmin ? t("azioniSuperAdminTitle") : t("azioniAdminTitle")}
                  </p>

                  <div className="mt-2 space-y-2">
                    <Link
                      href="/admin"
                      className="group flex w-full items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-3.5 py-3 text-left transition-colors hover:bg-gold/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
                          <Crown className="h-4 w-4 text-gold" />
                        </div>
                        <span className="text-sm font-medium text-burgundy">{t("pannelloAdmin")}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gold transition-colors group-hover:text-gold-light" />
                    </Link>

                    {adminQuickActions.map((action) => {
                      const Icon = action.icon;
                      const highlighted = action.prominent;
                      return (
                        <Link
                          key={action.href}
                          href={action.href}
                          className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-colors ${
                            highlighted
                              ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                              : "border-gold/20 bg-gold/5 hover:bg-gold/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                highlighted ? "bg-surface text-primary" : "bg-surface text-gold"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className={`text-sm font-medium ${highlighted ? "text-primary" : "text-burgundy"}`}>
                              {action.label}
                            </span>
                          </div>
                          <ArrowRight
                            className={`h-4 w-4 transition-colors ${
                              highlighted ? "text-primary/70 group-hover:text-primary" : "text-gold group-hover:text-gold-light"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isAdmin && (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2">
                  <Shield className="h-4 w-4 text-foreground/70" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t("richiediAdmin")}</p>
              </div>

              <div className={`rounded-xl border px-3 py-2.5 text-sm ${adminRequestTone}`}>
                {adminRequestSummary}
              </div>

              <p className="mt-3 text-xs text-foreground/60">{t("suggerimentoSicurezza")}</p>
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}
