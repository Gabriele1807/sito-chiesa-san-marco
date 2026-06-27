"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, AlertTriangle, Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthContext";
import type { UserRole, AgeGroup } from "@/types";
import { CHIESE_LIST } from "@/lib/churches";

type Step = "credentials" | "quiz" | "confirm";

export default function RegisterModal() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { showRegisterModal, setShowRegisterModal, setShowLoginModal, refresh } = useAuth();

  const [step, setStep] = useState<Step>("credentials");

  // Step 1: credenziali
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: quiz
  const [role, setRole] = useState<UserRole | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [chiesa, setChiesa] = useState("");
  const [requestAdmin, setRequestAdmin] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: "credente", label: t("registerRoleCredente"), description: t("registerRoleCredenteDesc") },
    { value: "madre", label: t("registerRoleMadre"), description: t("registerRoleMadreDesc") },
    { value: "padre", label: t("registerRolePadre"), description: t("registerRolePadreDesc") },
    { value: "diacono", label: t("registerRoleDiacono"), description: t("registerRoleDiaconoDesc") },
    { value: "ospite_chiesa", label: t("registerRoleOspite"), description: t("registerRoleOspiteDesc") },
  ];

  const ageGroups: { value: AgeGroup; label: string }[] = [
    { value: "0-11", label: t("registerAge_0_11") },
    { value: "12-18", label: t("registerAge_12_18") },
    { value: "19-29", label: t("registerAge_19_29") },
    { value: "30-45", label: t("registerAge_30_45") },
    { value: "46-65", label: t("registerAge_46_65") },
    { value: "65+", label: t("registerAge_65_plus") },
  ];

  const errorMap: Record<string, string> = {
    "Tutti i campi obbligatori devono essere compilati": t("registerErrorFillAll"),
    "Email non valida": t("registerErrorEmailInvalid"),
    "Username non valido (3-30 caratteri, solo lettere, numeri, . _ -)": t("registerErrorUsernameInvalid"),
    "La password deve essere tra 8 e 128 caratteri": t("registerErrorPasswordRange"),
    "Ruolo non valido": t("registerErrorRoleInvalid"),
    "Fascia d'età non valida": t("registerErrorAgeInvalid"),
    "Nome non valido": t("registerErrorNameInvalid"),
    "Cognome non valido": t("registerErrorSurnameInvalid"),
    "Email già registrata": t("registerErrorEmailTaken"),
    "Username già in uso": t("registerErrorUsernameTaken"),
    "Email o username già in uso": t("registerErrorDuplicate"),
    "Errore del server": t("registerErrorServer"),
  };

  function mapRegisterError(errorText?: string) {
    if (!errorText) return "";
    return errorMap[errorText] ?? "";
  }

  // Reset form quando si apre
  useEffect(() => {
    if (showRegisterModal) {
      setStep("credentials");
      setNome("");
      setCognome("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setRole("");
      setAgeGroup("");
      setChiesa("");
      setRequestAdmin(false);
      setError("");
      setLoading(false);
      setSuccess(false);
    }
  }, [showRegisterModal]);

  // Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && showRegisterModal) {
        setShowRegisterModal(false);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showRegisterModal, setShowRegisterModal]);

  if (!showRegisterModal) return null;

  function handleNextToQuiz() {
    setError("");
    if (!nome.trim() || !cognome.trim() || !email.trim() || !username.trim() || !password) {
      setError(t("registerErrorFillAll"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("registerErrorEmailInvalid"));
      return;
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError(t("registerErrorUsernameInvalid"));
      return;
    }
    if (password.length < 8) {
      setError(t("registerErrorPasswordLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("registerErrorPasswordMismatch"));
      return;
    }
    setStep("quiz");
  }

  async function handleSubmit() {
    setError("");
    if (!role || !ageGroup) {
      setError(t("registerErrorRoleAge"));
      return;
    }
    if (role === "ospite_chiesa" && !chiesa) {
      setError(t("registerErrorChurch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          cognome: cognome.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
          role,
          ageGroup,
          chiesa: role === "ospite_chiesa" ? chiesa : undefined,
          requestAdmin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // Auto-login dopo registrazione
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: email.trim().toLowerCase(),
            password,
            rememberMe: false,
          }),
        });
        const loginData = await loginRes.json();
        if (loginData.success && loginData.user) {
          localStorage.setItem("user_info", JSON.stringify(loginData.user));
        }
        await refresh();
        // Chiudi dopo un po'
        setTimeout(() => {
          setShowRegisterModal(false);
        }, 1500);
      } else {
        const mapped = mapRegisterError(data.error);
        setError(mapped || t("registerErrorGeneric"));
      }
    } catch {
      setError(t("registerErrorConnection"));
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchToLogin() {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowRegisterModal(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in border border-border">
        {/* Close */}
        <button
          onClick={() => setShowRegisterModal(false)}
          className="absolute top-4 right-4 text-foreground/40 hover:text-foreground/70 transition-colors z-10"
          aria-label={tc("close")}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto mb-3">
              <Image
                src="/logo-san-marco.png"
                alt={tc("logoAlt")}
                width={96}
                height={96}
                className="rounded-2xl"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {success ? t("registerTitleSuccess") : step === "credentials" ? t("registerTitle") : t("registerTitleComplete")}
            </h2>
            {!success && (
              <p className="text-foreground/60 text-sm mt-1">
                {step === "credentials" ? t("registerStep1") : t("registerStep2")}
              </p>
            )}
          </div>

          <div className="mb-4 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3">
            <p className="text-sm text-foreground/75 leading-relaxed">
              {t("registerReminder")}
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-green-400 text-sm">{t("registerSuccess")}</p>
            </div>
          )}

          {/* Error */}
          {error && !success && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Credentials */}
          {step === "credentials" && !success && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldNome")}</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldCognome")}</label>
                  <input
                    type="text"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldEmail")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("registerPlaceholderEmail")}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldUsername")}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("registerPlaceholderUsername")}
                  required
                  autoComplete="username"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldPassword")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("registerPlaceholderPassword")}
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldPasswordConfirm")}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("registerPlaceholderPasswordConfirm")}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleNextToQuiz}
                className="btn-primary w-full justify-center gap-2 mt-2"
              >
                {t("registerContinue")} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Quiz */}
          {step === "quiz" && !success && (
            <div className="space-y-4">
              {/* Ruolo */}
              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">{t("registerRoleTitle")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        if (r.value !== "ospite_chiesa") setChiesa("");
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        role === r.value
                          ? "border-accent bg-accent/20 text-foreground"
                          : "border-border bg-background/50 text-foreground/60 hover:bg-background/80 hover:text-foreground"
                      }`}
                    >
                      <p className="text-sm font-semibold">{r.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{r.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chiesa (solo per ospiti) */}
              {role === "ospite_chiesa" && (
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">{t("registerChurchLabel")}</label>
                  <select
                    value={chiesa}
                    onChange={(e) => setChiesa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  >
                    <option value="" className="bg-surface">{t("registerChurchPlaceholder")}</option>
                    {CHIESE_LIST.map((c) => (
                      <option key={c} value={c} className="bg-surface">{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fascia d'età */}
              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">{t("registerAgeTitle")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {ageGroups.map((ag) => (
                    <button
                      key={ag.value}
                      type="button"
                      onClick={() => setAgeGroup(ag.value)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        ageGroup === ag.value
                          ? "border-accent bg-accent/20 text-foreground"
                          : "border-border bg-background/50 text-foreground/60 hover:bg-background/80 hover:text-foreground"
                      }`}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Richiesta admin */}
              <div className="border border-border rounded-lg p-3 bg-background/30">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reg-request-admin"
                    checked={requestAdmin}
                    onChange={(e) => setRequestAdmin(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-background/50 text-accent focus:ring-accent focus:ring-offset-0"
                  />
                  <label htmlFor="reg-request-admin" className="text-sm text-foreground/70 select-none cursor-pointer">
                    {t("registerRequestAdmin")}
                  </label>
                </div>
                <p className="text-[10px] text-foreground/40 mt-1 ml-6">
                  {t("registerRequestAdminHelp")}
                </p>
              </div>

              {/* Bottoni */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="btn-secondary flex-1 justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> {t("registerBack")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? t("registerLoading") : t("registerButton")}
                </button>
              </div>
            </div>
          )}

          {/* Link a login */}
          {!success && (
            <div className="mt-4 text-center">
              <p className="text-sm text-foreground/60">
                {t("registerHaveAccount")}{" "}
                <button
                  onClick={handleSwitchToLogin}
                  className="text-accent hover:text-accent font-semibold transition-colors"
                >
                  {t("registerLoginAction")}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
