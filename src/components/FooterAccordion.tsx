"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function FooterAccordion({
  title,
  children,
  defaultOpen = false,
  isLast = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isLast?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current && containerRef.current) {
      // Delay per permettere all'animazione di partire
      setTimeout(() => {
        const contentEl = contentRef.current as HTMLElement;
        const containerEl = containerRef.current as HTMLElement;

        const rect = contentEl.getBoundingClientRect();
        const padding = 10; // spazio extra

        // se il fondo del contenuto è sotto la viewport, scrolla giù
        if (rect.bottom > window.innerHeight - padding) {
          const delta = rect.bottom - (window.innerHeight - padding);
          window.scrollBy({ top: delta, behavior: "smooth" });
          return;
        }

        // se la parte superiore del contenuto è sopra la viewport (utile se l'accordion è molto alto), scrolla su
        if (rect.top < padding) {
          const delta = rect.top - padding;
          window.scrollBy({ top: delta, behavior: "smooth" });
        }
      }, 50);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`${!isLast ? "border-b border-border/50" : ""}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-sm font-semibold text-foreground/80 hover:text-accent transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="pb-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}
