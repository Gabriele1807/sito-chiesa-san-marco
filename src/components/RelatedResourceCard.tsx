import Link from "next/link";

interface RelatedResourceCardProps {
  href: string;
  tag: string;
  tagColor: "primary" | "accent";
  title: string;
  subtitle?: string;
}

export default function RelatedResourceCard({ href, tag, tagColor, title, subtitle }: RelatedResourceCardProps) {
  const hoverColor = tagColor === "primary" ? "group-hover:text-primary" : "group-hover:text-accent";
  const tagColorClass = tagColor === "primary" ? "text-primary" : "text-accent";

  return (
    <Link href={href} className="group">
      <div className="card-hover bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <span className={`text-xs font-semibold uppercase tracking-wider ${tagColorClass}`}>
          {tag}
        </span>
        <h4 className={`font-bold text-gray-900 mt-1 ${hoverColor} transition-colors`}>
          {title}
        </h4>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}
