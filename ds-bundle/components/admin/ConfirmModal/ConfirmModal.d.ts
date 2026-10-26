import * as React from 'react';

/**
 * ConfirmModal — from chiesa-san-marco@0.1.0.
 */
export interface ConfirmModalProps {
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

export declare const ConfirmModal: React.ComponentType<ConfirmModalProps>;
