"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, ArrowRight } from "lucide-react";
import type { Icona } from "@/types";
import { toGDriveImageUrl } from "@/lib/gdrive";

interface Props {
  icone: Icona[];
}

export default function IconeGrid({ icone }: Props) {
  const t = useTranslations("icone");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [posizioneFilter, setPosizioneFilter] = useState("all");

  const categorie = [...new Set(icone.map((i) => i.categoria))];
  const posizioni = [...new Set(icone.map((i) => i.posizione))];

  const filtered = icone.filter((icona) => {
    if (categoriaFilter !== "all" && icona.categoria !== categoriaFilter) return false;
    if (posizioneFilter !== "all" && icona.posizione !== posizioneFilter) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {t("filtraCategoria")}
          </label>
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="all">{t("tutte")}</option>
            {categorie.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {t("filtraPosizione")}
          </label>
          <select
            value={posizioneFilter}
            onChange={(e) => setPosizioneFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="all">{t("tutte")}</option>
            {posizioni.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((icona) => (
          <Link key={icona.id} href={`/icone/${icona.slug}`} className="group">
            <div className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="h-52 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                {icona.immagini?.[0] ? (
                  <img
                    src={toGDriveImageUrl(icona.immagini[0])}
                    alt={icona.nomeSanto}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl opacity-30">🖼️</span>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md">
                  <span className="text-xs font-medium text-accent">{icona.categoria}</span>
                </div>
              </div>
              <div className="p-5">
                {/* FIX [21] — Title gray-900 at rest, amber-600 on hover only */}
                <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  {icona.nomeSanto}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {icona.posizione}
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {icona.descrizione}
                </p>
                {/* FIX [21] — Link text amber-600 on hover */}
                <div className="flex items-center gap-1 text-gray-500 font-medium text-sm mt-3 group-hover:text-amber-600 transition-colors">
                  {t("scopri")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nessuna icona trovata con i filtri selezionati.</p>
        </div>
      )}
    </>
  );
}
