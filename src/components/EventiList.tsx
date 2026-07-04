"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { it, ar } from "date-fns/locale";
import { CalendarDays, MapPin, Users, X, AlertTriangle, Lock, BadgeInfo, Info, Plus, Trash2 } from "lucide-react";
import type { Evento, RaccoglimentoPoint } from "@/types";
import { toGDriveImageUrl } from "@/lib/gdrive";
import { useAuth } from "@/components/auth/AuthContext";

type FamilyRole = "madre" | "padre" | "figlio";

interface FamilyMemberDraft {
  role: FamilyRole;
  fullName: string;
}

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
  registrationType: "self" as "self" | "other" | "family",
  familyMembers: [{ role: "figlio", fullName: "" }] as FamilyMemberDraft[],
  raccoglimentoPunto: null as RaccoglimentoPoint | null,
};

const UNIQUE_FAMILY_ROLES: FamilyRole[] = ["madre", "padre"];

function extractSurname(fullName: string): string {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  const parts = normalized.split(" ");
  if (parts.length === 1) return parts[0];
  return parts.slice(1).join(" ");
}

export default function EventiList({ eventi, iscrittiCount = {} }: Props) {
  const t = useTranslations("eventi");
  const locale = useLocale();
  const { type, loading, user, admin } = useAuth();
  const isAuthenticated = type === "user" || type === "admin";
  const [formOpen, setFormOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitted, setSubmitted] = useState(false);
  const [successFamily, setSuccessFamily] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [familyRoleWarning, setFamilyRoleWarning] = useState<string | null>(null);
  const [familyMemberSurnameDefault, setFamilyMemberSurnameDefault] = useState("");
  // Step preliminare: per chi si iscrive?
  const [enrollmentFor, setEnrollmentFor] = useState<"me" | "other" | "family" | null>(null);

  const selectedEvento = eventi.find((evento) => evento.id === formOpen) ?? null;
  const raccoglimentoPoints = selectedEvento?.raccoglimento ?? [];
  const familyMembers = formData.familyMembers;
  const padreInMembers = formData.registrationType === "family" && familyMembers.some((member) => member.role === "padre");
  const fatherMember = padreInMembers ? familyMembers.find((member) => member.role === "padre") ?? null : null;
  const fatherSurnameSource = padreInMembers ? extractSurname(fatherMember?.fullName || "") : formData.padreCognome;
  const currentIdentity = type === "user" ? user : type === "admin" ? admin : null;

  useEffect(() => {
    if (formData.registrationType === "family") {
      setFamilyMemberSurnameDefault(fatherSurnameSource.trim());
    } else {
      setFamilyMemberSurnameDefault("");
    }
  }, [fatherSurnameSource, formData.registrationType]);

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
    setEnrollmentFor(null); // Reset step preliminare
    setFormData({ ...emptyForm });
    setFamilyRoleWarning(null);
    setFamilyMemberSurnameDefault("");
    setSubmitted(false);
    setSuccessFamily(false);
    setErrors({});
    setServerError(null);
  }

  function selectEnrollmentType(type: "me" | "other" | "family") {
    setEnrollmentFor(type);
    if (type === "me" && currentIdentity) {
      // Pre-compila con i dati dell'utente
      setFormData(prev => ({
        ...prev,
        nome: currentIdentity.nome ?? "",
        cognome: currentIdentity.cognome ?? "",
      }));
    } else if (type === "other") {
      // Resetta i campi per compilazione manuale
      setFormData(prev => ({
        ...prev,
        nome: "",
        cognome: "",
        registrationType: "other",
        raccoglimentoPunto: null,
      }));
    } else if (type === "family") {
      setFormData(prev => ({
        ...prev,
        registrationType: "family",
        familyMembers: [{ role: "figlio", fullName: familyMemberSurnameDefault }],
        nome: "",
        cognome: "",
        padreNome: "",
        padreCognome: "",
        raccoglimentoPunto: null,
      }));
    }
  }

  function closeForm() {
    setFormOpen(null);
    setEnrollmentFor(null);
    setFormData({ ...emptyForm });
    setFamilyRoleWarning(null);
    setFamilyMemberSurnameDefault("");
  }

  function handlePhoneChange(val: string) {
    setFormData({ ...formData, telefono: val });
    
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, telefono: t("erroreTelefono") }));
    } else if (!/^\+?[0-9]*$/.test(val.trim().replace(/\s/g, ""))) {
      setErrors(prev => ({ ...prev, telefono: t("erroreTelefonoFormato") }));
    } else {
      setErrors(prev => {
        const rest = { ...prev };
        delete rest.telefono;
        return rest;
      });
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    const isFamily = formData.registrationType === "family";

    if (!isFamily) {
      if (!formData.nome.trim()) newErrors.nome = t("erroreNome");
      if (!formData.cognome.trim()) newErrors.cognome = t("erroreCognome");
      if (!formData.padreNome.trim()) newErrors.padreNome = t("errorePadreNome");
      if (!formData.padreCognome.trim()) newErrors.padreCognome = t("errorePadreCognome");
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = t("erroreTelefono");
    } else if (!/^\+?[0-9]+$/.test(formData.telefono.trim().replace(/\s/g, ""))) {
      newErrors.telefono = t("erroreTelefonoFormato");
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("erroreEmailFormato");
    }
    if (isFamily) {
      if (familyMembers.length === 0) {
        newErrors.familyMembers = t("erroreMembriFamiglia");
      }
      if (familyMembers.some((member) => !member.fullName.trim())) {
        newErrors.familyMembers = t("erroreMembroFamiglia");
      }
      const missingRoles = UNIQUE_FAMILY_ROLES.filter((role) => familyMembers.filter((member) => member.role === role).length > 1);
      if (missingRoles.length > 0) {
        newErrors.familyMembers = t("ruoloUnivocoGiaPresente");
      }
      if (!padreInMembers) {
        if (!formData.padreNome.trim()) newErrors.padreNome = t("errorePadreNome");
        if (!formData.padreCognome.trim()) newErrors.padreCognome = t("errorePadreCognome");
      }
    }
    if (selectedEvento?.showRaccoglimento && raccoglimentoPoints.length > 0 && !formData.raccoglimentoPunto) {
      newErrors.raccoglimentoPunto = t("errorePuntoRaccolta");
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
          nome: formData.registrationType === "family" ? "" : formData.nome,
          cognome: formData.registrationType === "family" ? "" : formData.cognome,
          padreNome: formData.registrationType === "family" && padreInMembers ? "" : formData.padreNome,
          padreCognome: formData.registrationType === "family" && padreInMembers ? "" : formData.padreCognome,
          fatherName: formData.registrationType === "family" && padreInMembers ? "" : formData.padreNome,
          fatherSurname: formData.registrationType === "family" && padreInMembers ? "" : formData.padreCognome,
          telefono: formData.telefono.trim().replace(/\s/g, ""),
          email: formData.email || undefined,
          note: formData.note || undefined,
          registrationType: formData.registrationType,
          familyMembers: formData.registrationType === "family" ? formData.familyMembers.filter((member) => member.fullName.trim()) : undefined,
          raccoglimentoPunto: formData.raccoglimentoPunto || undefined,
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
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatPaymentDeadline(value?: string): string {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return format(parsed, locale === "ar" ? "EEEE d MMMM yyyy" : "EEEE d MMMM yyyy", {
      locale: locale === "ar" ? ar : it,
    });
  }

  function formatRaccoglimentoTime(orario: string) {
    return t("raccoglimentoOrarioDisplay", { orario });
  }

  function updateFamilyMember(index: number, field: "role" | "fullName", value: string) {
    if (field === "role") {
      const nextRole = value as FamilyRole;
      if (UNIQUE_FAMILY_ROLES.includes(nextRole)) {
        const alreadyUsed = familyMembers.some((member, memberIndex) => memberIndex !== index && member.role === nextRole);
        if (alreadyUsed) {
          setFamilyRoleWarning(t("ruoloUnivocoGiaPresente"));
          return;
        }
      }
      setFamilyRoleWarning(null);
    }

    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      ),
    }));
  }

  function addFamilyMember() {
    setFormData((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { role: "figlio", fullName: familyMemberSurnameDefault }],
    }));
  }

  function removeFamilyMember(index: number) {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, memberIndex) => memberIndex !== index),
    }));
  }

  function availableRolesFor(index: number): Array<{ value: FamilyRole; label: string }> {
    const currentRole = familyMembers[index]?.role;
    const roles: Array<{ value: FamilyRole; label: string }> = [];

    for (const role of ["madre", "padre", "figlio"] as FamilyRole[]) {
      const usedElsewhere = familyMembers.some((member, memberIndex) => memberIndex !== index && member.role === role);
      if (!usedElsewhere || currentRole === role || role === "figlio") {
        roles.push({
          value: role,
          label: role === "madre" ? t("ruoloMadre") : role === "padre" ? t("ruoloPadre") : t("ruoloFiglio"),
        });
      }
    }

    return roles;
  }

  function setRaccoglimentoPunto(point: RaccoglimentoPoint) {
    setFormData((prev) => ({
      ...prev,
      raccoglimentoPunto: point,
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-foreground/50">{t("caricamentoAccesso")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-foreground">
          {t("guestTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-foreground/60 sm:text-base">
          {t("guestDescription")}
        </p>
        <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-4 py-2 text-xs font-medium text-foreground/70">
          <Lock className="h-3.5 w-3.5" />
          <span>{t("guestDescription")}</span>
        </div>
      </div>
    );
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

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-base font-semibold text-gray-900">
                {enrollmentFor === null ? t("perChiIscrizione") : t("formTitolo")}
              </h3>
              <button
                onClick={closeForm}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Step 1: Scelta per chi iscriversi (solo se loggato e non selezionato) */}
            {/* Step 1: Scelta per chi iscriversi (solo se loggato e non selezionato) */}
            {isAuthenticated && enrollmentFor === null && (
              <div className="p-6 space-y-5 bg-white">
                <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/60">
                        {t("stepIndicator", { current: 1, total: 2 })}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {selectedEvento?.titolo}
                      </p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white sm:max-w-[180px]">
                      <div className="h-full w-1/2 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                {/* Titolo + descrizione */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900">{t("perChiIscrizione")}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t("perChiIscrizioneDesc")}</p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* Card "Per me" */}
                  {/* Card "Per me" */}
                  <button
                    type="button"
                    onClick={() => selectEnrollmentType("me")}
                    className="card-hover rounded-lg border border-gray-200 bg-white px-4 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {t("perMe")}
                      </span>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        Profilo
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t("perMeDesc")}</p>
                  </button>

                  {/* Card "Per un'altra persona" */}
                  <button
                    type="button"
                    onClick={() => selectEnrollmentType("other")}
                    className="card-hover rounded-lg border border-gray-200 bg-white px-4 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {t("perAltro")}
                      </span>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        Nuovo
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t("perAltroDesc")}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectEnrollmentType("family")}
                    className="card-hover rounded-lg border border-gray-200 bg-white px-4 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:col-span-2"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">{t("perFamiglia")}</span>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {t("famiglia")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t("perFamigliaDesc")}</p>
                  </button>

                </div>
              </div>
            )}

            {/* Form di iscrizione */}
            {enrollmentFor !== null && !submitted && (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {isAuthenticated && (
                  <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/60">
                          {t("stepIndicator", { current: 2, total: 2 })}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {selectedEvento?.titolo}
                        </p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white sm:max-w-[180px]">
                        <div className="h-full w-full rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{t("formAvviso")}</p>
                </div>

                {selectedEvento?.referente && (
                  <div className="flex gap-2.5 items-start rounded-lg border border-primary/15 bg-primary/5 p-3">
                    <BadgeInfo className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                        {t("referenteLabel")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedEvento.referente}
                      </p>
                      <p className="text-xs leading-relaxed text-gray-600">
                        {t("referentePagamentoInfo", { referente: selectedEvento.referente })}
                      </p>
                    </div>
                  </div>
                )}

                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-danger">{serverError}</p>
                  </div>
                )}

                {selectedEvento?.paymentDeadline && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p className="text-sm font-medium text-amber-900">
                        {t("paymentDeadlineBanner", { date: formatPaymentDeadline(selectedEvento.paymentDeadline) })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sezione partecipante */}
                {enrollmentFor !== "family" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("sezionePartecipante")}</h4>
                    {enrollmentFor === "me" && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        {t("datiDalProfilo")}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("nome")} <span className="text-red-500 ml-0.5">*</span></label>
                      {enrollmentFor === "me" ? (
                        <div className="w-full px-3 py-2 border border-primary/20 bg-primary/5 rounded-lg text-sm text-gray-800 font-medium">
                          {formData.nome}
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Mario"
                          />
                          {errors.nome && <p className="text-xs text-danger mt-1">{errors.nome}</p>}
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("cognome")} <span className="text-red-500 ml-0.5">*</span></label>
                      {enrollmentFor === "me" ? (
                        <div className="w-full px-3 py-2 border border-primary/20 bg-primary/5 rounded-lg text-sm text-gray-800 font-medium">
                          {formData.cognome}
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={formData.cognome}
                            onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Rossi"
                          />
                          {errors.cognome && <p className="text-xs text-danger mt-1">{errors.cognome}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Sezione padre */}
                {enrollmentFor !== "family" && (
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
                )}

                {selectedEvento?.showRaccoglimento && raccoglimentoPoints.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("sezioneRaccoglimento")}</h4>
                    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                      <div className="space-y-3">
                        {raccoglimentoPoints.map((point) => {
                          const isSelected = formData.raccoglimentoPunto?.label === point.label && formData.raccoglimentoPunto?.orario === point.orario;
                          return (
                            <label
                              key={`${point.label}-${point.orario}`}
                              className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                                isSelected ? "border-primary bg-white" : "border-gray-200 bg-white/80 hover:border-primary/30"
                              }`}
                            >
                              <input
                                type="radio"
                                name="raccoglimento"
                                checked={isSelected}
                                onChange={() => setRaccoglimentoPunto(point)}
                                className="mt-0.5 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="flex-1 text-gray-700">
                                <span className="block font-semibold text-gray-900">{point.label}</span>
                                <span className="block text-xs text-gray-500">{formatRaccoglimentoTime(point.orario)}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.raccoglimentoPunto && <p className="mt-2 text-xs text-danger">{errors.raccoglimentoPunto}</p>}
                      {formData.raccoglimentoPunto && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <p className="text-xs leading-relaxed text-amber-800">
                            {t("raccoglimentoNote", {
                              punto: formData.raccoglimentoPunto.label,
                              orario: formatRaccoglimentoTime(formData.raccoglimentoPunto.orario),
                              referente: selectedEvento.referente || t("referenteSconosciuto"),
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {enrollmentFor === "family" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("sezioneFamiglia")}</h4>
                      <button type="button" onClick={addFamilyMember} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        <Plus className="h-3.5 w-3.5" /> {t("aggiungiMembro")}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {familyMembers.map((member, index) => (
                        <div key={index} className="rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-700">{t("membro")} {index + 1}</span>
                            <button type="button" onClick={() => removeFamilyMember(index)} className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                              <Trash2 className="h-3.5 w-3.5" /> {t("rimuoviMembro")}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{t("ruolo")}</label>
                              <select
                                value={member.role}
                                onChange={(e) => updateFamilyMember(index, "role", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                              >
                                {availableRolesFor(index).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{t("nomeCognome")}</label>
                              <input
                                type="text"
                                value={member.fullName}
                                onChange={(e) => updateFamilyMember(index, "fullName", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                                placeholder={t("nomeCognomePlaceholder")}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {familyRoleWarning && <p className="text-xs text-amber-700 mt-2">{familyRoleWarning}</p>}
                    {errors.familyMembers && <p className="text-xs text-danger mt-2">{errors.familyMembers}</p>}

                    {!padreInMembers && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    )}
                  </div>
                )}

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

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setEnrollmentFor(null)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {t("tornaSceltaIscrizione")}
                  </button>
                )}
              </form>
            )}

            {/* Success message */}
            {submitted && (
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
                  onClick={closeForm}
                  className="mt-4 btn-secondary"
                >
                  {t("chiudi")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
