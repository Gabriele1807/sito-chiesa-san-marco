EventRegistrations from chiesa-san-marco. Use via `window.ChiesaSanMarco.EventRegistrations` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface EventRegistrationsProps {
events: {
    id: string;
    titolo: string;
    data: string;
    persone: number;
    iscrizioni: number;
    pagate: number;
    postiDisponibili?: number;
    passato: boolean;
  }[];
}
```
