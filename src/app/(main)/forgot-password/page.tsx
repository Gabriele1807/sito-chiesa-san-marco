"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok && data?.error) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="eyebrow mb-2 text-accent">Accesso</p>
      <h1 className="font-display mb-4 text-2xl text-foreground">Password dimenticata?</h1>

      {submitted ? (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/80">
          Se l&apos;indirizzo è associato a un account, riceverai una email con le istruzioni
          per reimpostare la password.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-foreground/60">
            Inserisci il tuo indirizzo email: ti invieremo un link per reimpostare la password.
          </p>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-foreground/80">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          {error && <p className="badge-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? "Invio in corso..." : "Invia link di reset"}
          </button>
        </form>
      )}

      <Link href="/" className="mt-6 text-center text-sm text-foreground/60 hover:text-accent">
        Torna al login
      </Link>
    </div>
  );
}
