import Link from "next/link";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocumentCopy {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  intro: string;
  tocTitle: string;
  sections: LegalSection[];
  languageNotice?: string;
  related: { href: string; label: string };
}

/** Layout condiviso delle pagine Privacy e Termini (testi IT/AR passati dalla pagina). */
export default function LegalDocument({
  copy,
  updatedAt,
  locale,
}: {
  copy: LegalDocumentCopy;
  updatedAt: string;
  locale: string;
}) {
  // Il layout radice usa dir="ltr" per tutte le lingue: per testi lunghi in
  // arabo serve la direzione nativa, altrimenti numerazione e punteggiatura
  // finiscono sul lato sbagliato della riga.
  return (
    <div className="space-y-8" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <header className="border-border bg-surface relative overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-8">
        <div className="texture-lattice text-accent/[0.04] pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="font-display text-foreground mt-3 text-3xl sm:text-4xl">{copy.title}</h1>
          <p className="text-foreground/50 mt-2 text-xs">
            {copy.updatedLabel}: <time dateTime={updatedAt}>{updatedAt}</time>
          </p>
          <p className="text-foreground/75 mt-4 max-w-3xl text-base leading-relaxed">
            {copy.intro}
          </p>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <nav
          aria-label={copy.tocTitle}
          className="border-border bg-surface rounded-2xl border p-5 text-sm lg:sticky lg:top-[calc(var(--topbar-height)+1rem)]"
        >
          <p className="text-foreground/50 mb-3 text-xs font-semibold tracking-wide uppercase">
            {copy.tocTitle}
          </p>
          <ol className="space-y-0.5 lg:space-y-2">
            {copy.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-foreground/70 hover:text-accent focus-visible:ring-gold/40 block rounded py-2 focus-visible:ring-2 focus-visible:outline-none lg:py-0"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-3xl space-y-8">
          {copy.sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-[calc(var(--topbar-height)+1rem)]"
            >
              <h2 className="font-display text-foreground text-xl">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-foreground/75 mt-3 text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="text-foreground/75 marker:text-accent mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {copy.languageNotice && (
            <p className="border-accent/40 text-foreground/60 border-s-2 ps-4 text-xs leading-relaxed">
              {copy.languageNotice}
            </p>
          )}

          <Link href={copy.related.href} className="btn-secondary inline-flex">
            {copy.related.label}
          </Link>
        </article>
      </div>
    </div>
  );
}
