"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, AlertTriangle, Eye, EyeOff, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthContext";
import type { UserRole, AgeGroup } from "@/types";
import { CHIESE_LIST } from "@/lib/churches";
import { validatePasswordRules } from "@/lib/auth/password-rules";

type Step = "credentials" | "quiz" | "confirm";

type RegisterFieldName =
  | "nome"
  | "cognome"
  | "email"
  | "username"
  | "password"
  | "confirmPassword"
  | "role"
  | "ageGroup"
  | "chiesa";

function PasswordMatchIndicator({ password, confirm }: { password: string; confirm: string }) {
  const t = useTranslations("auth");

  if (!confirm) return null;

  const matches = password === confirm;
  const Icon = matches ? CheckCircle : XCircle;

  return (
    <div className="mt-2 flex items-center gap-2 text-sm">
      <Icon className={`h-4 w-4 shrink-0 ${matches ? "text-green-500" : "text-red-500"}`} />
      <span className={matches ? "text-green-700" : "text-red-600"}>
        {matches ? t("registerPasswordMatchOk") : t("registerPasswordMatchMismatch")}
      </span>
    </div>
  );
}

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterFieldName, string>>>({});
  const passwordRules = validatePasswordRules(password);
  const trimmedUsername = username.trim();
  const usernameRules = {
    noSpaces: trimmedUsername.length > 0 && !/\s/.test(trimmedUsername),
    notEmail: trimmedUsername.length > 0 && trimmedUsername.toLowerCase() !== email.trim().toLowerCase(),
    length: trimmedUsername.length >= 3 && trimmedUsername.length <= 20,
    characters: trimmedUsername.length > 0 && /^[a-zA-Z0-9_-]+$/.test(trimmedUsername),
  };
  const passwordRequirementItems = [
    { key: "length", label: t("registerPasswordRuleLength"), ok: passwordRules.length },
    { key: "uppercase", label: t("registerPasswordRuleUppercase"), ok: passwordRules.uppercase },
    { key: "number", label: t("registerPasswordRuleNumber"), ok: passwordRules.number },
    { key: "special", label: t("registerPasswordRuleSpecial"), ok: passwordRules.special },
  ] as const;
  const usernameRequirementItems = [
    { key: "noSpaces", label: t("registerUsernameRuleNoSpaces"), ok: usernameRules.noSpaces },
    { key: "notEmail", label: t("registerUsernameRuleNotEmail"), ok: usernameRules.notEmail },
    { key: "length", label: t("registerUsernameRuleLength"), ok: usernameRules.length },
    { key: "characters", label: t("registerUsernameRuleCharacters"), ok: usernameRules.characters },
  ] as const;

  // Step 2: quiz
  const [role, setRole] = useState<UserRole | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [chiesa, setChiesa] = useState("");
  const [requestAdmin, setRequestAdmin] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: "credente", label: t("registerRoleCredente"), description: t("registerRoleCredenteDesc") },
    { value: "madre", label: t("registerRoleMadre"), description: t("registerRoleMadreDesc") },
    { value: "padre", label: t("registerRolePadre"), description: t("registerRolePadreDesc") },
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
    "Username non valido (3-20 caratteri, solo lettere, numeri, _ -)": t("registerErrorUsernameInvalid"),
    "La password deve essere tra 8 e 128 caratteri": t("registerErrorPasswordRange"),
    "La password deve contenere almeno una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale": t("registerErrorPasswordRules"),
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

  function clearFieldError(field: RegisterFieldName) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function scrollToFirstError(errorsToHandle: Partial<Record<RegisterFieldName, string>>) {
    const fieldOrder: RegisterFieldName[] = ["nome", "cognome", "email", "username", "password", "confirmPassword", "role", "ageGroup", "chiesa"];
    const firstErrorField = fieldOrder.find((field) => errorsToHandle[field]);
    if (!firstErrorField) return;

    const el = modalScrollRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
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
      setFieldErrors({});
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
    const nextFieldErrors: Partial<Record<RegisterFieldName, string>> = {};

    if (!nome.trim() || !cognome.trim() || !email.trim() || !username.trim() || !password) {
      setError(t("registerErrorFillAll"));
      nextFieldErrors.nome = t("registerErrorFillAll");
      if (!cognome.trim()) nextFieldErrors.cognome = t("registerErrorFillAll");
      if (!email.trim()) nextFieldErrors.email = t("registerErrorFillAll");
      if (!username.trim()) nextFieldErrors.username = t("registerErrorFillAll");
      if (!password) nextFieldErrors.password = t("registerErrorFillAll");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("registerErrorEmailInvalid"));
      nextFieldErrors.email = t("registerErrorEmailInvalid");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError(t("registerErrorUsernameInvalid"));
      nextFieldErrors.username = t("registerErrorUsernameInvalid");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }
    if (password.length < 8) {
      setError(t("registerErrorPasswordLength"));
      nextFieldErrors.password = t("registerErrorPasswordLength");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }
    if (Object.values(passwordRules).some((rule) => !rule)) {
      setError(t("registerErrorPasswordRules"));
      nextFieldErrors.password = t("registerErrorPasswordRules");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }
    if (password !== confirmPassword) {
      setError(t("registerErrorPasswordMismatch"));
      nextFieldErrors.confirmPassword = t("registerErrorPasswordMismatch");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setStep("quiz");
  }

  async function handleSubmit() {
    setError("");
    const nextFieldErrors: Partial<Record<RegisterFieldName, string>> = {};

    if (!role || !ageGroup) {
      setError(t("registerErrorRoleAge"));
      if (!role) nextFieldErrors.role = t("registerErrorRoleAge");
      if (!ageGroup) nextFieldErrors.ageGroup = t("registerErrorRoleAge");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }
    if (role === "ospite_chiesa" && !chiesa) {
      setError(t("registerErrorChurch"));
      nextFieldErrors.chiesa = t("registerErrorChurch");
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
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
        if (data.error === "Email già registrata") {
          nextFieldErrors.email = t("registerErrorEmailTaken");
        } else if (data.error === "Username già in uso") {
          nextFieldErrors.username = t("registerErrorUsernameTaken");
        } else if (data.error === "Email o username già in uso") {
          nextFieldErrors.email = t("registerErrorEmailTaken");
          nextFieldErrors.username = t("registerErrorUsernameTaken");
        }
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
          scrollToFirstError(nextFieldErrors);
        }
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
      <div ref={modalScrollRef} className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in border border-border">
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
                    name="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      clearFieldError("nome");
                    }}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldCognome")}</label>
                  <input
                    name="cognome"
                    type="text"
                    value={cognome}
                    onChange={(e) => {
                      setCognome(e.target.value);
                      clearFieldError("cognome");
                    }}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldEmail")}</label>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  placeholder={t("registerPlaceholderEmail")}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldUsername")}</label>
                <input
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError("username");
                  }}
                  placeholder={t("registerPlaceholderUsername")}
                  required
                  autoComplete="username"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <div className="mt-2 rounded-2xl border border-amber-300/50 bg-amber-50/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-sm font-semibold">{t("registerUsernameHintTitle")}</p>
                  </div>
                  <p className="text-xs text-amber-800/90 mb-2">{t("registerUsernameHintText")}</p>
                  <div className="grid gap-1.5 text-sm">
                    {usernameRequirementItems.map((rule) => {
                      const Icon = rule.ok ? CheckCircle : XCircle;
                      return (
                        <div key={rule.key} className="flex items-center gap-2" style={{ transition: "color 200ms ease, opacity 200ms ease" }}>
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-all duration-200 ${rule.ok ? "text-green-500 scale-100 opacity-100" : "text-red-500 scale-95 opacity-80"}`}
                          />
                          <span className={`text-xs ${rule.ok ? "text-green-700" : "text-red-600"}`} style={{ transition: "color 200ms ease, opacity 200ms ease" }}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    {t("registerFieldPassword")}
                  </label>
                  <span className="text-[11px] text-gray-500">{t("registerPasswordRequirementsTitle")}</span>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                      clearFieldError("password");
                    }}
                    placeholder={t("registerPlaceholderPassword")}
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 bg-background/50 text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors pr-10"
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
                <div className="mt-3 text-xs text-gray-500">
                  {t("registerPasswordHintSpecial")}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-500">
                  {passwordRequirementItems.map((rule) => {
                    const Icon = rule.ok ? CheckCircle : XCircle;
                    return (
                      <div key={rule.key} className="flex items-center gap-2" style={{ transition: "color 200ms ease, opacity 200ms ease" }}>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-all duration-200 ${rule.ok ? "text-green-500 scale-100 opacity-100" : "text-red-500 scale-95 opacity-80"}`}
                        />
                        <span className={`text-xs ${rule.ok ? "text-green-700" : "text-red-600"}`} style={{ transition: "color 200ms ease, opacity 200ms ease" }}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{t("registerFieldPasswordConfirm")}</label>
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  placeholder={t("registerPlaceholderPasswordConfirm")}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder-foreground/40 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <PasswordMatchIndicator password={password} confirm={confirmPassword} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleNextToQuiz}
                  className="btn-primary w-full justify-center gap-2 mt-2"
                >
                  {t("registerContinue")} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Quiz */}
          {step === "quiz" && !success && (
            <div className="space-y-4">
              {/* Ruolo */}
              <div className="flex items-center justify-between gap-3">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">{t("registerRoleTitle")}</label>
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t("registerBack")}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        if (r.value !== "ospite_chiesa") setChiesa("");
                        clearFieldError("role");
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
              {/* Chiesa (solo per ospiti) */}
              {role === "ospite_chiesa" && (
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">{t("registerChurchLabel")}</label>
                  <select
                    name="chiesa"
                    value={chiesa}
                    onChange={(e) => {
                      setChiesa(e.target.value);
                      clearFieldError("chiesa");
                    }}
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
                      onClick={() => {
                        setAgeGroup(ag.value);
                        clearFieldError("ageGroup");
                      }}
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
