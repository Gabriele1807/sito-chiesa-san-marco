export interface LegalSection {
    id: string;
    title: string;
    paragraphs?: string[];
    items?: string[];
}
export interface LegalDocumentCopy {
    eyebrow: string;
    title: string;
    updatedLabel: string;
    intro: string;
    tocTitle: string;
    sections: LegalSection[];
    languageNotice?: string;
    related: {
        href: string;
        label: string;
    };
}
/** Layout condiviso delle pagine Privacy e Termini (testi IT/AR passati dalla pagina). */
export default function LegalDocument({ copy, updatedAt, locale, }: {
    copy: LegalDocumentCopy;
    updatedAt: string;
    locale: string;
}): import("react/jsx-runtime").JSX.Element;
