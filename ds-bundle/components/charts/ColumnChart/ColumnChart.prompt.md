ColumnChart from chiesa-san-marco. Use via `window.ChiesaSanMarco.ColumnChart` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface ColumnChartProps {
data: { label: string; fullLabel: string; value: number }[];
  unit: string;
  title: string;
}
```
