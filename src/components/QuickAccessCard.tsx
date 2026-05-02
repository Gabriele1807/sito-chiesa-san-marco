import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface QuickAccessCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
  badge?: string;
  delay?: number;
}

export default function QuickAccessCard({ href, icon: Icon, title, description, highlight, badge, delay }: QuickAccessCardProps) {
  return (
    <Link
      href={href}
      className="group animate-fade-in-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div
        className={`card-hover bg-surface rounded-3xl p-6 cursor-pointer h-full relative transition-all duration-300 ${
          highlight
            ? "border-2 border-accent shadow-lg hover:shadow-xl"
            : "border border-border shadow-sm hover:shadow-lg hover:border-accent"
        }`}
      >
        {badge && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-accent text-white text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
              {badge}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-sm uppercase tracking-[0.2em]">
              {title}
            </h3>
            <p className={`text-sm leading-relaxed mt-2 ${highlight ? "text-accent font-semibold" : "text-foreground/70"}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
