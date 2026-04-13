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
    <Link href={href} className="group animate-fade-in-up" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div
        className={`card-hover bg-slate-800 rounded-xl p-6 cursor-pointer h-full relative ${
          highlight
            ? "border-2 border-accent hover:border-accent-light"
            : "border border-white/10 hover:border-accent"
        }`}
      >
        {badge && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-amber-500 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
              {badge}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center text-center gap-3">
          <Icon className="w-7 h-7 text-accent" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h3>
          <p className={`text-xs leading-relaxed ${highlight ? "text-accent font-semibold" : "text-gray-400"}`}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
