"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { HandHeart, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

const TYPES = ["malati", "defunti", "famiglia", "ringraziamento", "altro"] as const;
const MAX_INTENTION = 1500;
const KNOWN_ERRORS = ["consent", "tipo", "intenzione", "nome", "email", "rate_limit"];

const emptyForm = {
  tipo: "" as (typeof TYPES)[number] | "",
  intenzione: "",
  nome: "",
  email: "",
  leggibileInLiturgia: false,
  consenso: false,
  website: "", // campo trappola per i bot, nascosto
};

export default function PrayerRequestForm() {
  const t = useTranslations("richiestePreghiera");
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const prefilled = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);

  // Utente con account: nome ed email precompilati (restano modificabili o cancellabili).
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- precompilazione una tantum dai dati di sessione
    setForm((f) => ({
      ...f,
      nome: f.nome || `${user.nome} ${user.cognome}`.trim(),
      email: f.email || user.email,
    }));
  }, [user]);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/richieste-preghiera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        setForm({ ...emptyForm, nome: form.nome, email: form.email });
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(
        KNOWN_ERRORS.includes(data.error) ? t(`errore_${data.error}`) : t("errore_generico")
      );
    } catch {
      setError(t("errore_generico"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border-success/30 bg-success/[0.06] rounded-2xl border p-6 text-center outline-none"
      >
        <CheckCircle2 className="text-success mx-auto mb-3 h-10 w-10" aria-hidden />
        <h2 className="font-display text-foreground text-2xl">{t("grazieTitolo")}</h2>
        <p className="text-foreground/70 mt-2 text-sm">{t("grazieTesto")}</p>
        <button type="button" onClick={() => setSent(false)} className="btn-secondary mt-5">
          {t("nuova")}
        </button>
      </div>
    );
  }

  const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-surface space-y-5 rounded-2xl border p-5 sm:p-6"
      noValidate
    >
      <fieldset>
        <legend className={labelClass}>{t("tipo")}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TYPES.map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                form.tipo === type
                  ? "border-accent bg-accent/[0.06] text-foreground"
                  : "border-border text-foreground/80 hover:border-accent/40"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={type}
                checked={form.tipo === type}
                onChange={() => setForm({ ...form, tipo: type })}
                className="accent-[#B45309]"
                required
              />
              {t(`tipo_${type}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="pr-intenzione" className={labelClass}>
          {t("intenzione")}
        </label>
        <textarea
          id="pr-intenzione"
          value={form.intenzione}
          onChange={(e) => setForm({ ...form, intenzione: e.target.value })}
          required
          minLength={3}
          maxLength={MAX_INTENTION}
          rows={5}
          placeholder={t("intenzionePlaceholder")}
          className="input-field"
        />
        <p className="text-foreground/45 mt-1 text-end text-xs">
          {t("caratteri", { count: form.intenzione.length, max: MAX_INTENTION })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pr-nome" className={labelClass}>
            {t("nome")}
          </label>
          <input
            id="pr-nome"
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            maxLength={100}
            autoComplete="name"
            className="input-field"
          />
          <p className="text-foreground/50 mt-1 text-xs">{t("nomeHint")}</p>
        </div>
        <div>
          <label htmlFor="pr-email" className={labelClass}>
            {t("email")}
          </label>
          <input
            id="pr-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={200}
            autoComplete="email"
            dir="ltr"
            className="input-field"
          />
          <p className="text-foreground/50 mt-1 text-xs">{t("emailHint")}</p>
        </div>
      </div>

      {/* Campo trappola: invisibile e fuori dal tab order; le persone non lo compilano. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </label>
      </div>

      <div className="space-y-3">
        <label className="text-foreground/80 flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.leggibileInLiturgia}
            onChange={(e) => setForm({ ...form, leggibileInLiturgia: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#B45309]"
          />
          {t("liturgia")}
        </label>
        <label className="text-foreground/80 flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.consenso}
            onChange={(e) => setForm({ ...form, consenso: e.target.checked })}
            required
            className="mt-0.5 h-4 w-4 accent-[#B45309]"
          />
          <span>
            {t.rich("consenso", {
              privacy: (chunks) => (
                <Link
                  href="/privacy"
                  className="text-accent font-semibold underline-offset-2 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="border-danger/20 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full justify-center sm:w-auto"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <HandHeart className="h-4 w-4" aria-hidden />
        )}
        {sending ? t("invio") : t("invia")}
      </button>
    </form>
  );
}
