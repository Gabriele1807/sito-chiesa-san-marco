"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { COPTIC_MONTHS } from "@/lib/calendario/months";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
  readError,
  secondaryButton,
  type FestaFissa,
} from "./shared";

interface Props {
  feste: FestaFissa[];
  onChange: () => void;
}

const emptyForm = { id: "", mese: "1", giorno: "1", nomeIt: "", nomeAr: "" };

export default function FesteTab({ feste, onChange }: Props) {
  const t = useTranslations("adminCalendario");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FestaFissa | null>(null);
  const [deleting, setDeleting] = useState(false);

  function edit(f: FestaFissa) {
    setEditId(f.id);
    setForm({
      id: f.id,
      mese: String(f.mese),
      giorno: String(f.giorno),
      nomeIt: f.nome.it ?? "",
      nomeAr: f.nome.ar ?? "",
    });
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        id: form.id.trim(),
        mese: Number(form.mese),
        giorno: Number(form.giorno),
        nome: { it: form.nomeIt, ar: form.nomeAr },
      };
      const res = await adminFetch("/api/admin/calendario/feste", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { ...body, id: editId } : { ...body, attiva: true }),
      });
      if (!res.ok) {
        setError(await readError(res, t("errore")));
        return;
      }
      showToast(t("salvato"));
      setForm(emptyForm);
      setEditId(null);
      onChange();
    } catch {
      setError(t("erroreConnessione"));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(f: FestaFissa) {
    const res = await adminFetch("/api/admin/calendario/feste", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, attiva: !f.attiva }),
    });
    if (res.ok) {
      showToast(t("salvato"));
      onChange();
    } else showToast(await readError(res, t("errore")), "error");
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(
        `/api/admin/calendario/feste?id=${encodeURIComponent(deleteTarget.id)}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error();
      showToast(t("eliminato"));
      setDeleteTarget(null);
      onChange();
    } catch {
      showToast(t("errore"), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-foreground/70 text-sm">{t("feste.spiega")}</p>

      <ul className="space-y-2">
        {feste.map((f) => (
          <li
            key={f.id}
            className={`${cardClass} flex flex-wrap items-center justify-between gap-3 py-3`}
          >
            <div>
              <p className="text-foreground font-semibold">
                {f.giorno} {COPTIC_MONTHS[f.mese - 1]?.translit} · {f.nome.it}
              </p>
              <p className="text-foreground/60 text-xs">
                <code>{f.id}</code>
                {f.nome.ar && (
                  <span dir="rtl" lang="ar" className="ms-2">
                    {f.nome.ar}
                  </span>
                )}
                {f.origine === "predefinita" && (
                  <span className="badge-neutral ms-2">{t("feste.predefinita")}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-gold h-4 w-4"
                  checked={f.attiva}
                  onChange={() => toggle(f)}
                />
                {f.attiva ? t("feste.attiva") : t("feste.disattiva")}
              </label>
              <button type="button" className={secondaryButton} onClick={() => edit(f)}>
                {t("modifica")}
              </button>
              <button
                type="button"
                className={`${secondaryButton} text-danger`}
                onClick={() => setDeleteTarget(f)}
                aria-label={`${t("elimina")} ${f.nome.it}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={submit}
        className={`${cardClass} space-y-4`}
        aria-labelledby="festa-form-title"
      >
        <h3 id="festa-form-title" className="text-foreground font-bold">
          {editId ? `${t("modifica")}: ${editId}` : t("feste.nuova")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
          <div>
            <label htmlFor="festa-id" className={labelClass}>
              {t("feste.id")}
            </label>
            <input
              id="festa-id"
              className={inputClass}
              value={form.id}
              disabled={Boolean(editId)}
              maxLength={40}
              aria-describedby="festa-id-hint"
              onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase() })}
            />
            <p id="festa-id-hint" className="text-foreground/50 mt-1 text-xs">
              {t("feste.idSpiega")}
            </p>
          </div>
          <div>
            <label htmlFor="festa-mese" className={labelClass}>
              {t("feste.mese")}
            </label>
            <select
              id="festa-mese"
              className={inputClass}
              value={form.mese}
              onChange={(e) => setForm({ ...form, mese: e.target.value })}
            >
              {COPTIC_MONTHS.map((m) => (
                <option key={m.number} value={m.number}>
                  {m.number} · {m.translit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="festa-giorno" className={labelClass}>
              {t("feste.giorno")}
            </label>
            <input
              id="festa-giorno"
              type="number"
              min={1}
              max={form.mese === "13" ? 6 : 30}
              className={inputClass}
              value={form.giorno}
              onChange={(e) => setForm({ ...form, giorno: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="festa-it" className={labelClass}>
              {t("feste.nomeIt")}
            </label>
            <input
              id="festa-it"
              className={inputClass}
              value={form.nomeIt}
              maxLength={160}
              onChange={(e) => setForm({ ...form, nomeIt: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="festa-ar" className={labelClass}>
              {t("feste.nomeAr")}
            </label>
            <input
              id="festa-ar"
              dir="rtl"
              lang="ar"
              className={inputClass}
              value={form.nomeAr}
              maxLength={160}
              onChange={(e) => setForm({ ...form, nomeAr: e.target.value })}
            />
          </div>
        </div>
        {error && (
          <p className="text-danger text-sm" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className={primaryButton} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : editId ? (
              <Save className="h-4 w-4" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            {editId ? t("salva") : t("aggiungi")}
          </button>
          {editId && (
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                setEditId(null);
                setForm(emptyForm);
              }}
            >
              {t("annulla")}
            </button>
          )}
        </div>
      </form>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t("elimina")}
        message={t("feste.confermaElimina", { nome: deleteTarget?.nome.it ?? "" })}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        tone="danger"
      />
    </div>
  );
}
