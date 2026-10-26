StatTile from chiesa-san-marco. Use via `window.ChiesaSanMarco.StatTile` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface StatTileProps {
label: string;
  value: number | string;
  /** Secondary line under the value, e.g. "+12 questo mese". */
  detail?: string;
  /** A lucide-react icon component, passed uninstantiated. */
  icon: React.ComponentType<{ className?: string; size?: string | number; strokeWidth?: string | number; color?: string }>;
}
```
