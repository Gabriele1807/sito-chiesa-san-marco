import Link from "next/link";
import { AlertTriangle, BellRing, Info, ArrowUpRight } from "lucide-react";
import type { AvvisoLevel } from "@/lib/mongo/announcements";

export interface AvvisoView {
  id: string;
  titolo: string;
  messaggio: string;
  livello: AvvisoLevel;
  link?: string;
  /** Testi già formattati nella lingua del visitatore. */
  levelLabel: string;
  meta?: string;
  linkLabel: string;
}

const LEVEL_STYLES: Record<AvvisoLevel, { box: string; badge: string; Icon: typeof Info }> = {
  urgente: {
    box: "border-danger/30 bg-danger/[0.06]",
    badge: "bg-danger text-white",
    Icon: AlertTriangle,
  },
  importante: {
    box: "border-accent/30 bg-accent/[0.06]",
    badge: "bg-accent text-white",
    Icon: BellRing,
  },
  info: { box: "border-border bg-surface", badge: "bg-sage/10 text-sage", Icon: Info },
};

export function AvvisoLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

/** Scheda di un avviso: stessa resa in home e nella pagina /avvisi. */
export default function AvvisoItem({ avviso }: { avviso: AvvisoView }) {
  const style = LEVEL_STYLES[avviso.livello];
  const { Icon } = style;

  return (
    <article className={`rounded-2xl border p-4 sm:p-5 ${style.box}`}>
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${avviso.livello === "urgente" ? "text-danger" : avviso.livello === "importante" ? "text-accent" : "text-sage"}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${style.badge}`}
            >
              {avviso.levelLabel}
            </span>
            {avviso.meta && <span className="text-foreground/55 text-xs">{avviso.meta}</span>}
          </div>
          <h3 className="text-foreground text-base font-bold">{avviso.titolo}</h3>
          <p className="text-foreground/75 text-sm leading-relaxed whitespace-pre-line">
            {avviso.messaggio}
          </p>
          {avviso.link && (
            <AvvisoLink
              href={avviso.link}
              className="text-accent inline-flex items-center gap-1 pt-1 text-sm font-semibold hover:underline"
            >
              {avviso.linkLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </AvvisoLink>
          )}
        </div>
      </div>
    </article>
  );
}
