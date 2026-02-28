"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, MapPin, Users, X } from "lucide-react";
import type { Evento } from "@/types";

interface Props {
  eventi: Evento[];
}

export default function EventiList({ eventi }: Props) {
  const t = useTranslations("eventi");
  const [formOpen, setFormOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", telefono: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openForm(eventoId: string) {
    setFormOpen(eventoId);
    setFormData({ nome: "", email: "", telefono: "", note: "" });
    setSubmitted(false);
    setErrors({});
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = "Il nome è obbligatorio";
    if (!formData.email.trim()) newErrors.email = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email non valida";
    if (!formData.telefono.trim()) newErrors.telefono = "Il telefono è obbligatorio";
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await fetch("/api/eventi/iscrizione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, eventoId: formOpen }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      console.error("Errore iscrizione");
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
        {eventi.map((evento) => (
          <div
            key={evento.id}
            className="card-hover bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Date badge */}
              <div className="sm:w-32 bg-primary flex sm:flex-col items-center justify-center p-4 gap-2 sm:gap-0">
                <CalendarDays className="w-5 h-5 text-accent" />
                <span className="text-white font-bold text-sm sm:text-center sm:mt-1">
                  {new Date(evento.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                </span>
              </div>

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
                  {evento.postiDisponibili && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {evento.postiDisponibili} {t("postiDisponibili")}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                  {evento.descrizione}
                </p>
                <button
                  onClick={() => openForm(evento.id)}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white
                             font-semibold rounded-lg btn-hover text-sm cursor-pointer"
                >
                  {t("iscriviti")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registration modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
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
                <button
                  onClick={() => setFormOpen(null)}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg btn-hover text-sm font-medium cursor-pointer"
                >
                  {t("chiudi")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("nome")}</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                               focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Mario Rossi"
                  />
                  {errors.nome && <p className="text-xs text-danger mt-1">{errors.nome}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                               focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="mario@email.com"
                  />
                  {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("telefono")}</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                               focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="+39 000 000 0000"
                  />
                  {errors.telefono && <p className="text-xs text-danger mt-1">{errors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("note")}</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                               focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    placeholder="Note aggiuntive..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-accent text-white font-semibold rounded-lg btn-hover text-sm cursor-pointer"
                >
                  {t("invia")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
