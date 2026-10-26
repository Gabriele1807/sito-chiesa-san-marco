AdminGate from chiesa-san-marco. Use via `window.ChiesaSanMarco.AdminGate` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface AdminGateProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}
```
