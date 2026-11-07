"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Loader2, Save, Trash2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import DayCard from "@/components/calendario/DayCard";
import DayReadings from "@/components/calendario/DayReadings";
import {
  READING_IDS,
  hasAnyText,
  type ContentLevel,
  type DayContent,
  type DayContentBundle,
  type LocalizedText,
  type ReadingId,
} from "@/lib/calendario/content";
import type { LiturgicalDayInfo } from "@/lib/calendario/resolver";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
  readError,
  secondaryButton,
  type CalendarioContenuto,
} from "./shared";

type FieldId = "sinassario" | ReadingId | "note";
const FIELDS: FieldId[] = ["sinassario", ...READING_IDS, "note"];

type Draft = Record<FieldId, { it: string; ar: string }> & { stato: "bozza" | "pubblicato" };

function draftFrom(c: CalendarioContenuto | null): Draft {
  const get = (f: FieldId): LocalizedText | undefined =>
    f === "sinassario" ? c?.sinassario : f === "note" ? c?.note : c?.letture?.[f];
  const fields = Object.fromEntries(
    FIELDS.map((f) => [f, { it: get(f)?.it ?? "", ar: get(f)?.ar ?? "" }])
  ) as Record<FieldId, { it: string; ar: string }>;
  return { ...fields, stato: c?.stato ?? "bozza" };
}

function toContent(level: ContentLevel, key: string, d: Draft): DayContent {
  const lt = (v: { it: string; ar: string }): LocalizedText | undefined => {
    const out: LocalizedText = {};
    if (v.it.trim()) out.it = v.it;
    if (v.ar.trim()) out.ar = v.ar;
    return Object.keys(out).length ? out : undefined;
  };
  const letture: DayContent["letture"] = {};
  for (const id of READING_IDS) {
    const v = lt(d[id]);
    if (v) letture[id] = v;
  }
  return { level, key, sinassario: lt(d.sinassario), note: lt(d.note), letture };
}

interface Props {
  level: ContentLevel;
  contentKey: string;
  existing: CalendarioContenuto | null;
  /** Contenuti salvati degli altri livelli dello stesso giorno, per l'anteprima. */
  others: Partial<Record<ContentLevel, CalendarioContenuto>>;
  info: LiturgicalDayInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContentEditor({
  level,
  contentKey,
  existing,
  others,
  info,
  onClose,
  onSaved,
}: Props) {
  const t = useTranslations("adminCalendario");
  const tl = useTranslations("calendario.letture");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(existing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const content = toContent(level, contentKey, draft);
      const res = await adminFetch("/api/admin/calendario/contenuti", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          livello: level,
          chiave: contentKey,
          stato: draft.stato,
          sinassario: content.sinassario,
          letture: content.letture,
          note: content.note,
        }),
      });
      if (!res.ok) {
        setError(await readError(res, t("errore")));
        return;
      }
      showToast(t("salvato"));
      onSaved();
    } catch {
      setError(t("erroreConnessione"));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await adminFetch(
        `/api/admin/calendario/contenuti?livello=${level}&chiave=${encodeURIComponent(contentKey)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      showToast(t("eliminato"));
      setConfirmDelete(false);
      onSaved();
    } catch {
      showToast(t("errore"), "error");
    } finally {
      setDeleting(false);
    }
  }

  const toDayContent = (c?: CalendarioContenuto): DayContent | null =>
    c
      ? {
          level: c.livello,
          key: c.chiave,
          sinassario: c.sinassario,
          letture: c.letture,
          note: c.note,
        }
      : null;
  const draftContent = toContent(level, contentKey, draft);
  const bundle: DayContentBundle = {
    fixed: level === "fixed" ? draftContent : toDayContent(others.fixed),
    movable: level === "movable" ? draftContent : toDayContent(others.movable),
    seasonal: level === "seasonal" ? draftContent : toDayContent(others.seasonal),
    available: false,
  };
  bundle.available = [bundle.fixed, bundle.movable, bundle.seasonal].some(hasAnyText);

  return (
    <form onSubmit={save} className={`${cardClass} space-y-5`} aria-labelledby="editor-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="editor-title" className="text-foreground text-lg font-bold">
            {t(`livelli.${level}`)} · <code className="text-gold">{contentKey}</code>
          </h3>
          {existing && (
            <p className="text-foreground/50 text-xs">
              {t("ultimaModifica", {
                autore: existing.updatedBy,
                data: new Date(existing.updatedAt).toLocaleString("it-IT"),
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={secondaryButton}
          aria-label={t("chiudi")}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="max-w-xs">
        <label htmlFor="editor-stato" className={labelClass}>
          {t("stato")}
        </label>
        <select
          id="editor-stato"
          className={inputClass}
          value={draft.stato}
          onChange={(e) => setDraft({ ...draft, stato: e.target.value as Draft["stato"] })}
        >
          <option value="bozza">{t("bozza")}</option>
          <option value="pubblicato">{t("pubblicato")}</option>
        </select>
      </div>

      {FIELDS.map((f) => (
        <fieldset key={f} className="space-y-2">
          <legend className="text-foreground text-sm font-semibold">{tl(f)}</legend>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <label htmlFor={`f-${f}-it`} className={labelClass}>
                {t("italiano")}
              </label>
              <textarea
                id={`f-${f}-it`}
                className={`${inputClass} min-h-24`}
                value={draft[f].it}
                maxLength={f === "note" ? 5000 : 40000}
                onChange={(e) => setDraft({ ...draft, [f]: { ...draft[f], it: e.target.value } })}
              />
            </div>
            <div>
              <label htmlFor={`f-${f}-ar`} className={labelClass}>
                {t("arabo")}
              </label>
              <textarea
                id={`f-${f}-ar`}
                dir="rtl"
                lang="ar"
                className={`${inputClass} min-h-24`}
                value={draft[f].ar}
                maxLength={f === "note" ? 5000 : 40000}
                onChange={(e) => setDraft({ ...draft, [f]: { ...draft[f], ar: e.target.value } })}
              />
            </div>
          </div>
        </fieldset>
      ))}

      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButton} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {t("salva")}
        </button>
        <button
          type="button"
          className={secondaryButton}
          aria-expanded={preview}
          onClick={() => setPreview(!preview)}
        >
          <Eye className="h-4 w-4" aria-hidden />
          {t("anteprima")}
        </button>
        {existing && (
          <button
            type="button"
            className={`${secondaryButton} text-danger`}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("elimina")}
          </button>
        )}
      </div>

      {preview && (
        <section aria-label={t("anteprima")} className="bg-background space-y-4 rounded-xl p-4">
          <p className="text-foreground/60 text-xs">{t("anteprimaSpiega")}</p>
          {info && <DayCard info={info} />}
          <DayReadings bundle={bundle} />
        </section>
      )}

      <ConfirmModal
        open={confirmDelete}
        title={t("elimina")}
        message={t("confermaElimina", { chiave: `${level}:${contentKey}` })}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
        tone="danger"
      />
    </form>
  );
}
