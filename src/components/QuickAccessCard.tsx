import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

interface QuickAccessCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
  badge?: string;
  delay?: number;
  comingSoon?: boolean;
}

export default function QuickAccessCard({ href, icon: Icon, title, description, highlight, badge, delay, comingSoon }: QuickAccessCardProps) {
  const cardContent = (
    <div
      className={`card-hover bg-surface rounded-3xl p-6 h-full relative transition-all duration-300 ${
        comingSoon
          ? "opacity-60 border border-border/50 cursor-not-allowed"
          : highlight
          ? "border-2 border-accent shadow-lg hover:shadow-xl cursor-pointer"
          : "border border-border shadow-sm hover:shadow-lg hover:border-accent cursor-pointer"
      }`}
    >
      {comingSoon ? (
        <div className="absolute inset-0 rounded-3xl flex items-center justify-center bg-background/40 backdrop-blur-xs">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <span className="inline-block bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>
      ) : (
        badge && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-accent text-white text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
              {badge}
            </span>
          </div>
        )
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
  );

  if (comingSoon) {
    return (
      <div
        className="group animate-fade-in-up focus-visible:outline-none"
        style={delay ? { animationDelay: `${delay}ms` } : undefined}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group animate-fade-in-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {cardContent}
    </Link>
  );
}
