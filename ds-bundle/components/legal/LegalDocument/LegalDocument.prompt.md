LegalDocument from chiesa-san-marco. Use via `window.ChiesaSanMarco.LegalDocument` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface LegalDocumentProps {
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
```
