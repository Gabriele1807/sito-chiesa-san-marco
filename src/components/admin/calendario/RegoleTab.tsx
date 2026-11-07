"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
  readError,
  type RegolaView,
} from "./shared";

function RuleCard({ rule, onChange }: { rule: RegolaView; onChange: () => void }) {
  const t = useTranslations("adminCalendario.regole");
  const tg = useTranslations("adminCalendario");
  const [attiva, setAttiva] = useState(rule.attiva);
  const [valore, setValore] = useState(rule.valore ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/calendario/regole", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, attiva, valore: valore || null }),
      });
      if (!res.ok) {
        setError(await readError(res, tg("errore")));
        return;
      }
      showToast(tg("salvato"));
      onChange();
    } catch {
      setError(tg("erroreConnessione"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className={`${cardClass} space-y-3`} aria-labelledby={`rule-${rule.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`rule-${rule.id}`} className="text-foreground font-bold">
          {t(`nomi.${rule.id}`)}
        </h3>
        <span className={rule.attiva ? "badge-success" : "badge-neutral"}>
          {rule.attiva ? t("stato_attiva") : t("stato_disattiva")}
        </span>
      </div>
      <p className="text-foreground/70 text-sm">{t(`descrizioni.${rule.id}`)}</p>
      {!rule.implemented ? (
        <p className="text-foreground/60 text-sm italic">{t("nonImplementata")}</p>
      ) : (
        <>
          <div className="max-w-xl">
            <label htmlFor={`rule-${rule.id}-value`} className={labelClass}>
              {t("valore")}
            </label>
            <select
              id={`rule-${rule.id}-value`}
              className={inputClass}
              value={valore}
              onChange={(e) => {
                setValore(e.target.value);
                if (!e.target.value) setAttiva(false);
              }}
            >
              <option value="">{t("scegli")}</option>
              {rule.options.map((o) => (
                <option key={o} value={o}>
                  {t(`valori.${o}`)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-gold h-4 w-4"
              checked={attiva}
              disabled={!valore}
              onChange={(e) => setAttiva(e.target.checked)}
            />
            {t("attiva")}
          </label>
          {rule.updatedBy && rule.updatedAt && (
            <p className="text-foreground/50 text-xs">
              {tg("ultimaModifica", {
                autore: rule.updatedBy,
                data: new Date(rule.updatedAt).toLocaleString("it-IT"),
              })}
            </p>
          )}
          {error && (
            <p className="text-danger text-sm" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={primaryButton} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {tg("salva")}
          </button>
        </>
      )}
    </form>
  );
}

export default function RegoleTab({
  regole,
  onChange,
}: {
  regole: RegolaView[];
  onChange: () => void;
}) {
  const t = useTranslations("adminCalendario.regole");
  return (
    <div className="space-y-4">
      <p className="text-foreground/70 text-sm">{t("spiega")}</p>
      {regole.map((r) => (
        <RuleCard key={`${r.id}-${r.updatedAt ?? ""}`} rule={r} onChange={onChange} />
      ))}
    </div>
  );
}
