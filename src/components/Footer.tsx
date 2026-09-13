import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FooterAccordion } from "./FooterAccordion";
import HashLink from "./HashLink";

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
    <footer className="mt-16 border-t border-accent/25 bg-surface-2/70 text-foreground/70">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        {/* Desktop Layout (lg e superiori) */}
        <div className="hidden lg:grid gap-10 grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-accent/40 text-accent text-xl">
                {"☦︎"}
              </div>
              <div>
                <p className="font-display text-foreground text-lg">
                  {tCommon("nomeChiesa")}
                </p>
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/45">{tFooter("aboutTitle")}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {tFooter("aboutText")}
            </p>
            <div className="flex flex-wrap gap-2">
              <HashLink href="/#orari" className="btn-primary">
                {tFooter("orariCta")}
              </HashLink>
              <Link href="/contatti" className="btn-secondary">
                {tNav("contatti")}
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/45">
              {tFooter("orariTitle")}
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {tFooter("orariDesc")}
            </p>
            <HashLink href="/#orari" className="btn-link">
              {tFooter("orariCta")}
            </HashLink>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/45">
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
              className="btn-link"
            >
              {tContact("indicazioniButton")}
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/45">
              {tFooter("quickLinksTitle")}
            </p>
            <nav className="grid gap-2 text-sm">
              <Link href="/" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("home")}
              </Link>
              <HashLink href="/#orari" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("orari")}
              </HashLink>
              <Link href="/video-corsi" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("videoCorsi")}
              </Link>
              <Link href="/eventi" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("eventi")}
              </Link>
              <Link href="/libreria" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("libreria")}
              </Link>
              <Link href="/icone" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("icone")}
              </Link>
              <Link href="/chi-siamo" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("chiSiamo")}
              </Link>
            </nav>

            <div className="pt-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/45 mb-2">
                {tFooter("socialTitle")}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {tFooter("facebook")}
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {tFooter("youtube")}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout (< lg) */}
        <div className="lg:hidden">
          {/* About Section - sempre aperto per primo */}
          <div className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center border border-accent/40 text-accent text-xl">
                {"☦︎"}
              </div>
              <div>
                <p className="font-display text-foreground text-lg">
                  {tCommon("nomeChiesa")}
                </p>
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/45">{tFooter("aboutTitle")}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              {tFooter("aboutText")}
            </p>
            <div className="flex flex-wrap gap-2">
              <HashLink href="/#orari" className="btn-primary">
                {tFooter("orariCta")}
              </HashLink>
              <Link href="/contatti" className="btn-secondary">
                {tNav("contatti")}
              </Link>
            </div>
          </div>

          {/* Orari Accordion */}
          <FooterAccordion title={tFooter("orariTitle")}>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {tFooter("orariDesc")}
            </p>
            <HashLink href="/#orari" className="btn-link text-xs">
              {tFooter("orariCta")}
            </HashLink>
          </FooterAccordion>

          {/* Contatti Accordion */}
          <FooterAccordion title={tNav("contatti")}>
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
              className="btn-link text-xs"
            >
              {tContact("indicazioniButton")}
            </a>
          </FooterAccordion>

          {/* Quick Links Accordion */}
          <FooterAccordion title={tFooter("quickLinksTitle")}>
            <nav className="grid gap-3 text-sm">
              <Link href="/" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("home")}
              </Link>
              <HashLink href="/#orari" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("orari")}
              </HashLink>
              <Link href="/video-corsi" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("videoCorsi")}
              </Link>
              <Link href="/eventi" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("eventi")}
              </Link>
              <Link href="/libreria" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("libreria")}
              </Link>
              <Link href="/icone" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("icone")}
              </Link>
              <Link href="/chi-siamo" className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                {tNav("chiSiamo")}
              </Link>
            </nav>
          </FooterAccordion>

          {/* Social Accordion */}
          <FooterAccordion title={tFooter("socialTitle")} isLast={true}>
            <div className="flex items-center gap-4 text-sm">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {tFooter("facebook")}
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded text-foreground/70 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {tFooter("youtube")}
              </a>
            </div>
          </FooterAccordion>
        </div>

        {/* Footer Bottom - sempre presente */}
        <div className="mt-8 lg:mt-10 border-t border-border/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/45">
          <p>{tCommon("copyright")}</p>
          <p>{tFooter("note")}</p>
        </div>
      </div>
    </footer>
  );
}
