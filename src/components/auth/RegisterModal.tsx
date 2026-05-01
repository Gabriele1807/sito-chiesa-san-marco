"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, AlertTriangle, Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "./AuthContext";
import type { UserRole, AgeGroup } from "@/types";
import { CHIESE_LIST } from "@/lib/churches";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "credente", label: "Credente", description: "Membro della comunità" },
  { value: "madre", label: "Madre", description: "Madre di famiglia" },
  { value: "padre", label: "Padre", description: "Padre di famiglia" },
  { value: "ospite_chiesa", label: "Ospite da un'altra chiesa", description: "Proveniente da un'altra parrocchia" },
];

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "0-11", label: "0–11 anni" },
  { value: "12-18", label: "12–18 anni" },
  { value: "19-29", label: "19–29 anni" },
  { value: "30-45", label: "30–45 anni" },
  { value: "46-65", label: "46–65 anni" },
  { value: "65+", label: "65+ anni" },
];

type Step = "credentials" | "quiz" | "confirm";

export default function RegisterModal() {
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
      setError("Compila tutti i campi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email non valida");
      return;
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError("Username: min 3 caratteri, solo lettere, numeri, . _ -");
      return;
    }
    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri");
      return;
    }
    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }
    setStep("quiz");
  }

  async function handleSubmit() {
    setError("");
    if (!role || !ageGroup) {
      setError("Seleziona il tuo ruolo e la fascia d'età");
      return;
    }
    if (role === "ospite_chiesa" && !chiesa) {
      setError("Seleziona la tua chiesa di provenienza");
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
        setError(data.error || "Errore nella registrazione");
      }
    } catch {
      setError("Errore di connessione");
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
      <div className="relative w-full max-w-md bg-primary rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Close */}
        <button
          onClick={() => setShowRegisterModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto mb-3">
              <Image
                src="/logo-san-marco.png"
                alt="Logo Chiesa Copta San Marco"
                width={96}
                height={96}
                className="rounded-2xl"
              />
            </div>
            <h2 className="text-xl font-bold text-white">
              {success ? "Registrazione completata!" : step === "credentials" ? "Registrati" : "Completa il profilo"}
            </h2>
            {!success && (
              <p className="text-gray-400 text-sm mt-1">
                {step === "credentials" ? "Passaggio 1 di 2" : "Passaggio 2 di 2"}
              </p>
            )}
          </div>

          {/* Success */}
          {success && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-green-400 text-sm">Benvenuto nella comunità!</p>
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
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Nome</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Cognome</label>
                  <input
                    type="text"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@esempio.it"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  autoComplete="username"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caratteri"
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors pr-10"
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

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Conferma Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleNextToQuiz}
                className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors flex items-center justify-center gap-2 mt-2"
              >
                Continua <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Quiz */}
          {step === "quiz" && !success && (
            <div className="space-y-4">
              {/* Ruolo */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Il tuo ruolo</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        if (r.value !== "ospite_chiesa") setChiesa("");
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        role === r.value
                          ? "border-amber-600 bg-amber-600/20 text-white"
                          : "border-white/20 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
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
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Chiesa di provenienza</label>
                  <select
                    value={chiesa}
                    onChange={(e) => setChiesa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                  >
                    <option value="" className="bg-primary">Seleziona...</option>
                    {CHIESE_LIST.map((c) => (
                      <option key={c} value={c} className="bg-primary">{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fascia d'età */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Fascia d&apos;età</label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_GROUPS.map((ag) => (
                    <button
                      key={ag.value}
                      type="button"
                      onClick={() => setAgeGroup(ag.value)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        ageGroup === ag.value
                          ? "border-amber-600 bg-amber-600/20 text-white"
                          : "border-white/20 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Richiesta admin */}
              <div className="border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reg-request-admin"
                    checked={requestAdmin}
                    onChange={(e) => setRequestAdmin(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-amber-600 focus:ring-amber-600 focus:ring-offset-0"
                  />
                  <label htmlFor="reg-request-admin" className="text-sm text-gray-300 select-none cursor-pointer">
                    Richiedi accesso admin
                  </label>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 ml-6">
                  La richiesta verrà valutata da un super admin. Fino all&apos;approvazione avrai accesso come utente normale.
                </p>
              </div>

              {/* Bottoni */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="flex-1 py-2.5 rounded-lg border border-white/20 text-gray-300 font-semibold text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Indietro
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Registrazione..." : "Registrati"}
                </button>
              </div>
            </div>
          )}

          {/* Link a login */}
          {!success && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Hai già un account?{" "}
                <button
                  onClick={handleSwitchToLogin}
                  className="text-amber-500 hover:text-amber-400 font-semibold transition-colors"
                >
                  Accedi
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
