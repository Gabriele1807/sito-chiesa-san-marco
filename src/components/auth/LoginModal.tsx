"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthContext";

export default function LoginModal() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { showLoginModal, setShowLoginModal, setShowRegisterModal, setIsExplicitGuest, refresh } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const errorMap: Record<string, string> = {
    "Credenziali non valide": t("loginErrorInvalid"),
    "Credenziali obbligatorie": t("loginErrorRequired"),
    "Troppi tentativi. Riprova tra 15 minuti.": t("loginErrorRateLimit"),
    "Errore del server": t("loginErrorServer"),
    "Account admin disattivato. Contatta il superadmin.": t("loginErrorAdminDisabled"),
    "Account disattivato.": t("loginErrorUserDisabled"),
  };

  function formatError(errorText?: string, remaining?: number) {
    const base = errorText && errorMap[errorText] ? errorMap[errorText] : t("loginErrorGeneric");
    if (remaining !== undefined && remaining > 0) {
      return `${base} ${t("loginAttemptsRemaining", { count: remaining })}`;
    }
    return base;
  }

  // Reset form quando si apre
  useEffect(() => {
    if (showLoginModal) {
      setIdentifier("");
      setPassword("");
      setRememberMe(false);
      setShowPassword(false);
      setError("");
      setLoading(false);
    }
  }, [showLoginModal]);

  // Chiudi con Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && showLoginModal) {
        setShowLoginModal(false);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showLoginModal, setShowLoginModal]);

  if (!showLoginModal) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.type === "admin" && data.user) {
          // Salva info admin in localStorage per la sidebar admin
          localStorage.setItem("admin_info", JSON.stringify(data.user));
        }
        if (data.type === "user" && data.user) {
          localStorage.setItem("user_info", JSON.stringify(data.user));
        }

        setShowLoginModal(false);
        await refresh();
      } else {
        setError(formatError(data.error, data.remaining));
      }
    } catch {
      setError(t("loginErrorConnection"));
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchToRegister() {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowLoginModal(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-primary rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
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
            <h2 className="text-xl font-bold text-white">{t("loginTitle")}</h2>
            <p className="text-gray-400 text-sm mt-1">{t("loginSubtitle")}</p>
          </div>

          {/* Errore */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                {t("loginIdentifierLabel")}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("loginIdentifierPlaceholder")}
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                {t("loginPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="login-remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-gold focus:ring-gold focus:ring-offset-0"
              />
              <label htmlFor="login-remember" className="text-sm text-gray-400 select-none cursor-pointer">
                {t("loginRemember")}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {loading ? t("loginLoading") : t("loginButton")}
            </button>
          </form>

          {/* Link a registrazione */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              {t("loginNoAccount")}{" "}
              <button
                onClick={handleSwitchToRegister}
                className="text-gold hover:text-gold-light font-semibold transition-colors"
              >
                {t("loginRegisterAction")}
              </button>
            </p>
          </div>

          {/* Accesso ospite */}
          <div className="mt-3 text-center">
            <button
              onClick={() => {
                setIsExplicitGuest(true);
                setShowLoginModal(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              {t("loginGuest")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
