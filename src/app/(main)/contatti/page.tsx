import { getTranslations } from "next-intl/server";
import {
  Mail,
  Phone,
  MapPin,
  Cross,
  Facebook,
  ExternalLink,
} from "lucide-react";
import YouTubeLiveSection from "@/components/YouTubeLiveSection";

export const revalidate = 60;

const EMAIL = "info@sanmarcocopti.it";
const PHONE = "+39 02 1234 5678";
const ADDRESS_MAPS_URL = "https://maps.app.goo.gl/fUqwmy5ZGXMidqWf8";
const FACEBOOK_URL = "https://www.facebook.com/people/Chiesa-di-San-Marco/61556571205312/";

export default async function ContattiPage() {
  const t = await getTranslations("contatti");

  return (
    <div className="space-y-14">
      {/* ── HEADER ── */}
      <section className="animate-[fadeInUp_0.4s_ease_both]">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {t("titolo")}
        </h1>
        <p className="text-gray-500 leading-relaxed max-w-2xl">
          {t("sottotitolo")}
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SEZIONE YOUTUBE — dinamica, dati dal canale reale
          ══════════════════════════════════════════════════════════ */}
      <YouTubeLiveSection />

      {/* ══════════════════════════════════════════════════════════
          GRIGLIA CONTATTI PRINCIPALI
          ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Email */}
          <div
            key="email"
            style={{ animationDelay: "0ms" }}
            className="animate-[fadeInUp_0.4s_ease_both] bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:scale-[1.01] hover:shadow-md hover:border-slate-300 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{t("emailSezione")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{t("emailDesc")}</p>
              <p className="text-sm font-semibold text-primary break-all">{EMAIL}</p>
            </div>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t("emailButton")}
            </a>
          </div>

          {/* Telefono */}
          <div
            key="telefono"
            style={{ animationDelay: "60ms" }}
            className="animate-[fadeInUp_0.4s_ease_both] bg-emerald-50/35 rounded-2xl border border-emerald-100 shadow-sm p-5 flex flex-col gap-4 hover:scale-[1.01] hover:shadow-md hover:border-emerald-200 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{t("telefonoSezione")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">{t("telefonoDesc")}</p>
              <p className="text-sm font-bold text-gray-900 mb-1">{PHONE}</p>
              <p className="text-xs text-gray-400">{t("telefonoOrari")}</p>
            </div>
            <a
              href={`tel:${PHONE.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Chiama ora
            </a>
          </div>

          {/* Indirizzo */}
          <div
            key="indirizzo"
            style={{ animationDelay: "120ms" }}
            className="animate-[fadeInUp_0.4s_ease_both] bg-amber-50/35 rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col gap-4 hover:scale-[1.01] hover:shadow-md hover:border-amber-200 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{t("indirizzoSezione")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{t("indirizzoDesc")}</p>
              <address className="not-italic text-sm text-gray-700 leading-relaxed">
                <span className="font-medium">{t("indirizzoVia")}</span><br />
                {t("indirizzo2")}<br />
                {t("indirizzo3")}
              </address>
            </div>
            <a
              href={ADDRESS_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-light transition-colors"
            >
              <MapPin className="w-4 h-4" />
              {t("indicazioniButton")}
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SACERDOTI
          ══════════════════════════════════════════════════════════ */}
      <section className="animate-[fadeIn_0.5s_ease_both]">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 px-1">
          {t("sacerdoteSezione")}
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Padre Mina Kolta */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Cross className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{t("sacerdote1Nome")}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t("sacerdoteRuolo")}</p>
            </div>
          </div>

          {/* Padre Gabriele */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Cross className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{t("sacerdote2Nome")}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t("sacerdoteRuolo")}</p>
            </div>
          </div>

          {/* Padre Anghelos */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Cross className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{t("sacerdote3Nome")}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t("sacerdoteRuolo")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SOCIAL MEDIA
          ══════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-5">
          {t("socialSezione")}
        </h2>

        {/* Facebook */}
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0">
            <Facebook className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 group-hover:text-[#1877F2] transition-colors">
              Facebook
            </p>
            <p className="text-sm text-gray-500">{t("facebookDesc")}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#1877F2] transition-colors shrink-0" />
        </a>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MAPPA GOOGLE MAPS EMBED
          ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative">
          {/* Google Maps iframe */}
          <div className="h-52 sm:h-72 relative">
            <iframe
              src="https://maps.google.com/maps?q=Via+Senato+4+20121+Milano+MI&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Chiesa Copta Ortodossa di San Marco – Milano"
            />
            {/*
              Transparent overlay che blocca il drag/pan della mappa.
              La mappa rimane centrata sulla chiesa (dove si trova la croce).
              Cliccando si apre Google Maps in una nuova scheda.
            */}
            <a
              href={ADDRESS_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0"
              aria-label={t("indicazioniButton")}
              tabIndex={-1}
            />
            {/* Cross pin — centrato sull'iframe = posizione chiesa */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                <div className="relative w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl">
                  <Cross className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <a
            href={ADDRESS_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-5 py-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-gray-900">{t("indirizzoVia")}</p>
              <p className="text-xs text-gray-500">
                {t("indirizzo2")} · {t("indirizzo3")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
              <MapPin className="w-4 h-4" />
              {t("indicazioniButton")}
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
