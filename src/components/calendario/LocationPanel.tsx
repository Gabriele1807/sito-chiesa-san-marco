"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { LocateFixed, MapPin, Sunset } from "lucide-react";
import type { DayState, Location, ManualSunset } from "@/lib/calendario/service";
import { updateCalendarPrefs, type StoredLocation } from "./prefs";
import { PRESET_LOCATIONS, type LocationSource } from "./locations";
import { formatTime, parseTimeInput, toTimeInput } from "./format";

interface Props {
  state: DayState | null;
  location: Location;
  source: LocationSource;
  stored: StoredLocation | undefined;
  manualSunset: ManualSunset | null | undefined;
  defaultLocation: Location;
  locale: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

export default function LocationPanel({
  state,
  location,
  source,
  stored,
  manualSunset,
  defaultLocation,
  locale,
}: Props) {
  const t = useTranslations("calendario");
  const id = useId();
  const [geoStatus, setGeoStatus] = useState<"idle" | "pending" | "denied">("idle");
  const [custom, setCustom] = useState({ name: "", lat: "", lon: "" });
  const [customError, setCustomError] = useState(false);

  // Se il visitatore ha già concesso la posizione e non ha scelto altro, usala.
  useEffect(() => {
    if (stored || !("permissions" in navigator) || !("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled || status.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            updateCalendarPrefs({
              location: {
                kind: "geo",
                lat: round(pos.coords.latitude),
                lon: round(pos.coords.longitude),
              },
            }),
          () => {},
          { maximumAge: 3_600_000, timeout: 10_000 }
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stored]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("idle");
        updateCalendarPrefs({
          location: {
            kind: "geo",
            lat: round(pos.coords.latitude),
            lon: round(pos.coords.longitude),
          },
        });
      },
      () => setGeoStatus("denied"),
      { maximumAge: 3_600_000, timeout: 10_000 }
    );
  }

  function applyCustom(e: React.FormEvent) {
    e.preventDefault();
    const lat = Number(custom.lat.replace(",", "."));
    const lon = Number(custom.lon.replace(",", "."));
    if (!custom.lat || !custom.lon || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) {
      setCustomError(true);
      return;
    }
    setCustomError(false);
    updateCalendarPrefs({
      location: { kind: "custom", name: custom.name.trim().slice(0, 80), lat, lon },
    });
  }

  const sunsetText = state
    ? state.sunset.source === "manual"
      ? t("tramontoManuale", { ora: formatTime(state.sunset.at, state.timeZone, locale) })
      : state.sunset.source === "fallback"
        ? t("tramontoRipiego", { ora: formatTime(state.sunset.at, state.timeZone, locale) })
        : t("localitaInUso", {
            nome: location.name,
            ora: formatTime(state.sunset.at, state.timeZone, locale),
          })
    : null;

  const selectValue = stored?.kind === "preset" ? stored.id : source === "default" ? "" : "__other";

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="border-border bg-surface rounded-2xl border px-5 py-4"
    >
      <h2
        id={`${id}-title`}
        className="text-foreground/60 text-xs font-semibold tracking-wider uppercase"
      >
        {t("localita")}
      </h2>
      <p className="text-foreground mt-1 flex items-center gap-2 text-sm font-semibold">
        <MapPin className="text-accent h-4 w-4 shrink-0" aria-hidden />
        <span>{sunsetText ?? location.name}</span>
      </p>
      {state && (
        <p className="text-foreground/60 mt-0.5 text-xs">
          {t("fusoOrario", { fuso: state.timeZone })}
        </p>
      )}

      <details className="group mt-3">
        <summary className="btn-link cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          {t("cambiaLocalita")}
        </summary>

        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label
                htmlFor={`${id}-preset`}
                className="text-foreground/70 mb-1 block text-xs font-semibold"
              >
                {t("preimpostate")}
              </label>
              <select
                id={`${id}-preset`}
                className="input-field"
                value={selectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") updateCalendarPrefs({ location: undefined });
                  else if (v !== "__other")
                    updateCalendarPrefs({ location: { kind: "preset", id: v } });
                }}
              >
                <option value="">{defaultLocation.name}</option>
                {PRESET_LOCATIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(`citta.${p.id}`)}
                  </option>
                ))}
                {selectValue === "__other" && <option value="__other">{location.name}</option>}
              </select>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={locate}
              disabled={geoStatus === "pending"}
            >
              <LocateFixed className="h-4 w-4" aria-hidden />
              {geoStatus === "pending" ? t("posizioneInCorso") : t("usaPosizione")}
            </button>
          </div>
          <p className="text-foreground/60 text-xs" role="status">
            {geoStatus === "denied"
              ? t("posizioneNegata", { nome: location.name })
              : t("posizioneNota")}
          </p>

          <form onSubmit={applyCustom} className="space-y-2" noValidate>
            <fieldset>
              <legend className="text-foreground/70 mb-1 text-xs font-semibold">
                {t("coordinate")}
              </legend>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="sr-only" htmlFor={`${id}-name`}>
                  {t("nomeLocalita")}
                </label>
                <input
                  id={`${id}-name`}
                  className="input-field"
                  placeholder={t("nomeLocalita")}
                  value={custom.name}
                  maxLength={80}
                  onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                />
                <label className="sr-only" htmlFor={`${id}-lat`}>
                  {t("latitudine")}
                </label>
                <input
                  id={`${id}-lat`}
                  className="input-field"
                  inputMode="decimal"
                  placeholder={t("latitudine")}
                  value={custom.lat}
                  aria-invalid={customError || undefined}
                  onChange={(e) => setCustom({ ...custom, lat: e.target.value })}
                />
                <label className="sr-only" htmlFor={`${id}-lon`}>
                  {t("longitudine")}
                </label>
                <input
                  id={`${id}-lon`}
                  className="input-field"
                  inputMode="decimal"
                  placeholder={t("longitudine")}
                  value={custom.lon}
                  aria-invalid={customError || undefined}
                  onChange={(e) => setCustom({ ...custom, lon: e.target.value })}
                />
                <button type="submit" className="btn-secondary">
                  {t("applica")}
                </button>
              </div>
            </fieldset>
            {customError && (
              <p className="text-danger text-xs" role="alert">
                {t("coordinateNonValide")}
              </p>
            )}
          </form>

          <div className="space-y-2">
            <label className="text-foreground flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-accent h-4 w-4"
                checked={Boolean(manualSunset)}
                onChange={(e) =>
                  updateCalendarPrefs({
                    manualSunset: e.target.checked ? { hour: 18, minute: 0 } : null,
                  })
                }
              />
              <Sunset className="text-accent h-4 w-4" aria-hidden />
              {t("tramontoManualeAttiva")}
            </label>
            {manualSunset && (
              <div className="max-w-40">
                <label
                  htmlFor={`${id}-sunset`}
                  className="text-foreground/70 mb-1 block text-xs font-semibold"
                >
                  {t("orarioTramonto")}
                </label>
                <input
                  id={`${id}-sunset`}
                  type="time"
                  className="input-field"
                  value={toTimeInput(manualSunset.hour, manualSunset.minute)}
                  onChange={(e) => {
                    const v = parseTimeInput(e.target.value);
                    if (v) updateCalendarPrefs({ manualSunset: v });
                  }}
                />
              </div>
            )}
          </div>

          {(stored || manualSunset) && (
            <button
              type="button"
              className="btn-link"
              onClick={() => updateCalendarPrefs({ location: undefined, manualSunset: null })}
            >
              {t("ripristina", { nome: defaultLocation.name })}
            </button>
          )}
        </div>
      </details>
    </section>
  );
}
