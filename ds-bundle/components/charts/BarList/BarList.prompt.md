BarList from chiesa-san-marco. Use via `window.ChiesaSanMarco.BarList` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface BarListProps {
/** Ordered categories; every value is also printed, never colour-only. */
  data: { label: string; value: number }[];
  /** Unit suffix shown next to each value, e.g. "persone". */
  unit: string;
}
```
