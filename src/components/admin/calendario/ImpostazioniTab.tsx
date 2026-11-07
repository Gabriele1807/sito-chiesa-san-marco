"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import type { Location } from "@/lib/calendario/service";
import { cardClass, inputClass, labelClass, primaryButton, readError } from "./shared";

export interface ImpostazioniData {
  localita: Location;
  visibile: boolean;
  sectionId: string;
  updatedAt?: string;
  updatedBy?: string;
}

export default function ImpostazioniTab({
  data,
  onChange,
}: {
  data: ImpostazioniData;
  onChange: () => void;
}) {
  const t = useTranslations("adminCalendario");
  const [form, setForm] = useState({
    name: data.localita.name,
    lat: String(data.localita.lat),
    lon: String(data.localita.lon),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [visibile, setVisibile] = useState(data.visibile);
  const [toggling, setToggling] = useState(false);

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/calendario/impostazioni", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localita: {
            name: form.name,
            lat: Number(form.lat.replace(",", ".")),
            lon: Number(form.lon.replace(",", ".")),
          },
        }),
      });
      if (!res.ok) {
        setError(await readError(res, t("errore")));
        return;
      }
      showToast(t("salvato"));
      onChange();
    } catch {
      setError(t("erroreConnessione"));
    } finally {
      setSaving(false);
    }
  }

  /** Riusa l'API esistente di visibilità delle sezioni. */
  async function toggleVisibility() {
    setToggling(true);
    try {
      const res = await adminFetch(
        `/api/admin/section-visibility/${encodeURIComponent(data.sectionId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !visibile }),
        }
      );
      if (!res.ok) throw new Error();
      setVisibile(!visibile);
      showToast(t("salvato"));
    } catch {
      showToast(t("errore"), "error");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={saveLocation}
        className={`${cardClass} space-y-4`}
        aria-labelledby="loc-title"
      >
        <div>
          <h2 id="loc-title" className="text-foreground font-bold">
            {t("impostazioni.localita")}
          </h2>
          <p className="text-foreground/60 text-sm">{t("impostazioni.localitaSpiega")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["name", "lat", "lon"] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`loc-${k}`} className={labelClass}>
                {t(
                  `impostazioni.${k === "name" ? "nome" : k === "lat" ? "latitudine" : "longitudine"}`
                )}
              </label>
              <input
                id={`loc-${k}`}
                className={inputClass}
                inputMode={k === "name" ? "text" : "decimal"}
                maxLength={80}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        {data.updatedBy && data.updatedAt && (
          <p className="text-foreground/50 text-xs">
            {t("ultimaModifica", {
              autore: data.updatedBy,
              data: new Date(data.updatedAt).toLocaleString("it-IT"),
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
          {t("salva")}
        </button>
      </form>

      <section className={`${cardClass} space-y-3`} aria-labelledby="vis-title">
        <h2 id="vis-title" className="text-foreground font-bold">
          {t("impostazioni.visibilita")}
        </h2>
        <p className="text-foreground/60 text-sm">{t("impostazioni.visibilitaSpiega")}</p>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            role="switch"
            aria-checked={visibile}
            className="accent-gold h-5 w-5"
            checked={visibile}
            disabled={toggling}
            onChange={toggleVisibility}
          />
          {visibile ? t("impostazioni.visibile") : t("impostazioni.nascosta")}
        </label>
      </section>
    </div>
  );
}
