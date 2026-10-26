GuestGate from chiesa-san-marco. Use via `window.ChiesaSanMarco.GuestGate` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface GuestGateProps {
  children: React.ReactNode;
  /** Messaggio da mostrare quando la sezione è bloccata */
  message?: string;
}
```
