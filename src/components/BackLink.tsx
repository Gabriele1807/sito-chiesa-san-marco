import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  label: string;
}

export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <div className="mb-4">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {label}
      </Link>
    </div>
  );
}
