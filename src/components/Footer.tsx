import Link from "next/link";
import { getTranslations } from "next-intl/server";

const ADDRESS_MAPS_URL = "https://maps.app.goo.gl/fUqwmy5ZGXMidqWf8";
const FACEBOOK_URL = "https://www.facebook.com/people/Chiesa-di-San-Marco/61556571205312/";
const YOUTUBE_URL = "https://www.youtube.com/@SanMarco-Milano";

export default async function Footer() {
  const [tCommon, tFooter, tNav, tContact] = await Promise.all([
    getTranslations("common"),
    getTranslations("footer"),
    getTranslations("nav"),
    getTranslations("contatti"),
  ]);

  return (
    <footer className="mt-16 bg-surface-2 text-foreground/70 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-accent/20 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">☦</span>
              </div>
              <div>
                <p className="font-display text-foreground text-base">
                  {tCommon("nomeChiesa")}
                </p>
                <p className="text-xs text-foreground/50">{tFooter("aboutTitle")}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {tFooter("aboutText")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/orari" className="btn-ghost">
                {tFooter("orariCta")}
              </Link>
              <Link href="/contatti" className="btn-ghost">
                {tNav("contatti")}
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/40">
              {tFooter("orariTitle")}
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {tFooter("orariDesc")}
            </p>
            <Link href="/orari" className="btn-link text-foreground hover:text-accent">
              {tFooter("orariCta")}
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/40">
              {tNav("contatti")}
            </p>
            <div className="text-sm text-foreground/70 space-y-2">
              <p>{tContact("indirizzoVia")}</p>
              <p>{tContact("indirizzo2")}</p>
              <p>{tContact("emailIndirizzo")}</p>
              <p>{tContact("telefonoNumero")}</p>
            </div>
            <a
              href={ADDRESS_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link text-foreground hover:text-accent"
            >
              {tContact("indicazioniButton")}
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/40">
              {tFooter("quickLinksTitle")}
            </p>
            <nav className="grid gap-2 text-sm">
              <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors">
                {tNav("home")}
              </Link>
              <Link href="/orari" className="text-foreground/70 hover:text-foreground transition-colors">
                {tNav("orari")}
              </Link>
              <Link href="/eventi" className="text-foreground/70 hover:text-foreground transition-colors">
                {tNav("eventi")}
              </Link>
              <Link href="/libreria" className="text-foreground/70 hover:text-foreground transition-colors">
                {tNav("libreria")}
              </Link>
              <Link href="/icone" className="text-foreground/70 hover:text-foreground transition-colors">
                {tNav("icone")}
              </Link>
              <Link href="/chi-siamo" className="text-foreground/70 hover:text-foreground transition-colors">
                {tNav("chiSiamo")}
              </Link>
            </nav>

            <div className="pt-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/40 mb-2">
                {tFooter("socialTitle")}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  {tFooter("facebook")}
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  {tFooter("youtube")}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/40">
          <p>{tCommon("copyright")}</p>
          <p>{tFooter("note")}</p>
        </div>
      </div>
    </footer>
  );
}
