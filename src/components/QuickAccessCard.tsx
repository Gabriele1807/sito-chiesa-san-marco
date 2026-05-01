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
        className={`card-hover bg-white rounded-2xl p-6 cursor-pointer h-full relative transition-all duration-300 ${
          highlight
            ? "border-2 border-accent shadow-lg hover:shadow-xl"
            : "border border-gray-200 shadow-md hover:shadow-lg hover:border-accent"
        }`}
      >
        {badge && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-accent text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
              {badge}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">{title}</h3>
          <p className={`text-xs leading-relaxed ${highlight ? "text-accent font-semibold" : "text-gray-600"}`}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
