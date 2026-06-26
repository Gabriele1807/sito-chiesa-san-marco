"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, MapPin, Users, X, AlertTriangle } from "lucide-react";
import type { Evento } from "@/types";
import { toGDriveImageUrl } from "@/lib/gdrive";

interface Props {
  eventi: Evento[];
  /** Conteggio iscrizioni per evento: { [eventoId]: count } */
  iscrittiCount?: Record<string, number>;
}

const emptyForm = {
  nome: "",
  cognome: "",
  padreNome: "",
  padreCognome: "",
  telefono: "",
  email: "",
  note: "",
};

export default function EventiList({ eventi, iscrittiCount = {} }: Props) {
  const t = useTranslations("eventi");
  const [formOpen, setFormOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitted, setSubmitted] = useState(false);
  const [successFamily, setSuccessFamily] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Calcola i posti rimasti per un evento; null se illimitati */
  function postiRimasti(evento: Evento): number | null {
    if (typeof evento.postiDisponibili !== "number" || evento.postiDisponibili <= 0) {
      return null;
    }
    const iscritti = iscrittiCount[evento.id] ?? 0;
    return Math.max(0, evento.postiDisponibili - iscritti);
  }

  function openForm(eventoId: string) {
    setFormOpen(eventoId);
    setFormData({ ...emptyForm });
    setSubmitted(false);
    setSuccessFamily(false);
    setErrors({});
    setServerError(null);
  }

  function handlePhoneChange(val: string) {
    setFormData({ ...formData, telefono: val });
    
    // Validazione immediata
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, telefono: t("erroreTelefono") }));
    } else if (!/^\+?[0-9]*$/.test(val.trim().replace(/\s/g, ""))) {
      // Usiamo * invece di + per permettere di cancellare tutto senza errore di formato se vuoto
      setErrors(prev => ({ ...prev, telefono: t("erroreTelefonoFormato") }));
    } else {
      setErrors(prev => {
        const { telefono, ...rest } = prev;
        return rest;
      });
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = t("erroreNome");
    if (!formData.cognome.trim()) newErrors.cognome = t("erroreCognome");
    if (!formData.padreNome.trim()) newErrors.padreNome = t("errorePadreNome");
    if (!formData.padreCognome.trim()) newErrors.padreCognome = t("errorePadreCognome");
    if (!formData.telefono.trim()) {
      newErrors.telefono = t("erroreTelefono");
    } else if (!/^\+?[0-9]+$/.test(formData.telefono.trim().replace(/\s/g, ""))) {
      newErrors.telefono = t("erroreTelefonoFormato");
    }
    // Email opzionale: validata solo se presente
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("erroreEmailFormato");
    }
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/eventi/iscrizione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId: formOpen,
          nome: formData.nome,
          cognome: formData.cognome,
          padreNome: formData.padreNome,
          padreCognome: formData.padreCognome,
          telefono: formData.telefono.trim().replace(/\s/g, ""),
          email: formData.email || undefined,
          note: formData.note || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSuccessFamily(Boolean(data?.sameFamily));
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        switch (data?.errorCode) {
          case "duplicate":
            setServerError(t("erroreDuplicato"));
            break;
          case "full":
            setServerError(t("erroreEsaurito"));
            break;
          default:
            setServerError(t("erroreGenerico"));
        }
      }
    } catch {
      setServerError(t("erroreGenerico"));
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <>
      <div className="grid gap-6">
        {eventi.map((evento, index) => {
          const rimasti = postiRimasti(evento);
          const esaurito = rimasti !== null && rimasti <= 0;
          return (
            <div
              key={evento.id}
              className="group card-hover bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image or date badge */}
                {evento.immagine ? (
                  <div className="sm:w-48 h-40 sm:h-auto bg-gray-100 shrink-0 overflow-hidden">
                    <img
                      src={toGDriveImageUrl(evento.immagine)}
                      alt={evento.titolo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="sm:w-32 bg-primary flex sm:flex-col items-center justify-center p-4 gap-2 sm:gap-0">
                    <CalendarDays className="w-5 h-5 text-accent" />
                    <span className="text-white font-bold text-sm sm:text-center sm:mt-1">
                      {new Date(evento.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-6">
                  <h3 className="text-xl font-bold text-gray-900">{evento.titolo}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(evento.data)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {evento.luogo}
                    </span>
                    {/* Indicatore posti: mostrato solo se l'evento ha un limite */}
                    {rimasti !== null && (
                      <span className={`flex items-center gap-1 font-medium ${esaurito ? "text-danger" : "text-gray-600"}`}>
                        <Users className="w-3.5 h-3.5" />
                        {esaurito ? t("postiEsauriti") : t("postiRimasti", { posti: rimasti })}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                    {evento.descrizione}
                  </p>
                  <button
                    onClick={() => openForm(evento.id)}
                    disabled={esaurito}
                    className="mt-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {esaurito ? t("postiEsauriti") : t("iscriviti")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{t("formTitolo")}</h3>
              <button
                onClick={() => setFormOpen(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {t("successMessage")}
                </p>
                {successFamily && (
                  <p className="text-sm text-gray-500 mt-2">{t("successFamiglia")}</p>
                )}
                <button
                  onClick={() => setFormOpen(null)}
                  className="mt-4 btn-secondary"
                >
                  {t("chiudi")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Avviso documento d'identità */}
                <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{t("formAvviso")}</p>
                </div>

                {/* Errore dal server */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-danger">{serverError}</p>
                  </div>
                )}

                {/* Sezione partecipante */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("sezionePartecipante")}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("nome")} <span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Mario"
                      />
                      {errors.nome && <p className="text-xs text-danger mt-1">{errors.nome}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("cognome")} <span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        type="text"
                        value={formData.cognome}
                        onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Rossi"
                      />
                      {errors.cognome && <p className="text-xs text-danger mt-1">{errors.cognome}</p>}
                    </div>
                  </div>
                </div>

                {/* Sezione padre */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("sezionePadre")}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("padreNome")} <span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        type="text"
                        value={formData.padreNome}
                        onChange={(e) => setFormData({ ...formData, padreNome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Giuseppe"
                      />
                      {errors.padreNome && <p className="text-xs text-danger mt-1">{errors.padreNome}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("padreCognome")} <span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        type="text"
                        value={formData.padreCognome}
                        onChange={(e) => setFormData({ ...formData, padreCognome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Rossi"
                      />
                      {errors.padreCognome && <p className="text-xs text-danger mt-1">{errors.padreCognome}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">{t("padreHelper")}</p>
                </div>

                {/* Sezione contatti */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("sezioneContatti")}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("telefono")} <span className="text-red-500 ml-0.5">*</span></label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                          errors.telefono ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-primary"
                        }`}
                        placeholder="+39 000 000 0000"
                      />
                      {errors.telefono && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.telefono}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}{' '}<span className="text-gray-400 font-normal text-xs">{t("emailOpzionale")}</span></label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="mario@email.com"
                      />
                      {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("note")}</label>
                      <textarea
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        placeholder="Note aggiuntive..."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t("invioInCorso") : t("invia")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
