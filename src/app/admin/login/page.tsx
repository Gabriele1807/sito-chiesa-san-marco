"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setSessionExpired(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSessionExpired(false);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (data.success) {
        // Salva info admin nel localStorage per la sidebar
        if (data.user) {
          localStorage.setItem("admin_info", JSON.stringify(data.user));
        }
        router.push("/profilo");
      } else {
        let msg = data.error || "Credenziali non valide";
        if (data.remaining !== undefined && data.remaining > 0) {
          msg += ` (${data.remaining} tentativi rimasti)`;
        }
        setError(msg);
      }
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">☦</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Pannello Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Chiesa di San Marco – Milano</p>
      </div>

      {/* Session expired banner */}
      {sessionExpired && (
        <div className="flex items-center gap-2 bg-gold/20 border border-gold/30 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-gold/80 shrink-0" />
          <p className="text-gold/90 text-sm">
            La sessione è scaduta. Effettua nuovamente l&apos;accesso.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
          />
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-gold focus:ring-gold focus:ring-offset-0"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-400 select-none cursor-pointer">
            Ricordami per 7 giorni
          </label>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>
    </div>
  );
}
