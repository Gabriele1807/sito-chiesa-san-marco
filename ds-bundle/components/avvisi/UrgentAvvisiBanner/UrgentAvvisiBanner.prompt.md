UrgentAvvisiBanner from chiesa-san-marco. Use via `window.ChiesaSanMarco.UrgentAvvisiBanner` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface UrgentAvvisiBannerProps {
avvisi: {
    key: string;
    titolo: string;
    messaggio: string;
    link?: string;
  }[];
}
```
