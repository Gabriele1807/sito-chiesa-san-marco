"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validatePasswordRules } from "@/lib/auth/password-rules";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rules = validatePasswordRules(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link non valido o scaduto");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono");
      return;
    }
    if (!Object.values(rules).every(Boolean)) {
      setError("La password non soddisfa tutti i requisiti richiesti");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Link non valido o scaduto");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } catch {
      setError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/80">
        Link non valido o scaduto.{" "}
        <Link href="/forgot-password" className="text-accent hover:underline">
          Richiedi un nuovo link
        </Link>
        .
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/80">
        Password aggiornata. Verrai reindirizzato alla pagina di accesso...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-foreground/80">
          Nuova password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm text-foreground/80">
          Conferma password
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-field"
        />
      </div>
      <ul className="space-y-1 text-xs text-foreground/60">
        <li className={rules.length ? "text-success" : ""}>Almeno 8 caratteri</li>
        <li className={rules.lowercase ? "text-success" : ""}>Una lettera minuscola</li>
        <li className={rules.uppercase ? "text-success" : ""}>Una lettera maiuscola</li>
        <li className={rules.number ? "text-success" : ""}>Un numero</li>
        <li className={rules.special ? "text-success" : ""}>Un carattere speciale</li>
      </ul>
      {error && <p className="badge-danger">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? "Salvataggio..." : "Reimposta password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="eyebrow mb-2 text-accent">Accesso</p>
      <h1 className="font-display mb-4 text-2xl text-foreground">Reimposta la tua password</h1>
      <Suspense fallback={<p className="text-sm text-foreground/60">Caricamento...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
