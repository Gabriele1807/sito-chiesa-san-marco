import * as React from 'react';

/**
 * LegalDocument — from chiesa-san-marco@0.1.0.
 */
export interface LegalDocumentProps {
copy: {
    eyebrow: string;
    title: string;
    updatedLabel: string;
    intro: string;
    tocTitle: string;
    sections: { id: string; title: string; paragraphs?: string[]; items?: string[] }[];
    languageNotice?: string;
    related: { href: string; label: string };
  };
  updatedAt: string;
  /** Locale tag, e.g. "it" or "ar"; drives date formatting and direction. */
  locale: string;
}

export declare const LegalDocument: React.ComponentType<LegalDocumentProps>;
