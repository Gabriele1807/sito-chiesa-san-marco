ConfirmModal from chiesa-san-marco. Use via `window.ChiesaSanMarco.ConfirmModal` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface ConfirmModalProps {
open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both buttons and shows `loadingLabel` on the confirm button. */
  loading?: boolean;
  /** Confirm button text (defaults to "Elimina"). */
  confirmLabel?: string;
  loadingLabel?: string;
  /** "danger" (red, default) for deletions, "primary" for everything else. */
  tone?: "danger" | "primary";
}
```
