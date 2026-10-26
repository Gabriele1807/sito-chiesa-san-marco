FooterAccordion from chiesa-san-marco. Use via `window.ChiesaSanMarco.FooterAccordion` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface FooterAccordionProps {
title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  /** Drops the bottom divider, for the last row in a stack. */
  isLast?: boolean;
}
```
