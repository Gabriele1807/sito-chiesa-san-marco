PreghieraExpand from chiesa-san-marco. Use via `window.ChiesaSanMarco.PreghieraExpand` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface PreghieraExpandProps {
/** Full prayer text; collapsed behind a "read more" control until expanded. */
  testo: string;
  /** Label for the expand control, e.g. "Leggi la preghiera". */
  labelRead: string;
}
```
