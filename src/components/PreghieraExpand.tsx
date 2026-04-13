"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  testo: string;
  labelRead: string;
}

export default function PreghieraExpand({ testo, labelRead }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-primary transition-colors cursor-pointer"
      >
        {labelRead}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100 animate-fade-in-up">
          <p className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-line">
            {testo}
          </p>
        </div>
      )}
    </div>
  );
}
