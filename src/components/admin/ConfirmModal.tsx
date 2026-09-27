"use client";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** Testo del pulsante di conferma (predefinito "Elimina"). */
  confirmLabel?: string;
  loadingLabel?: string;
  /** "danger" (rosso, predefinito) per eliminazioni, "primary" per altre azioni. */
  tone?: "danger" | "primary";
}

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Elimina",
  loadingLabel = "Eliminando...",
  tone = "danger",
}: Props) {
  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface animate-scale-in w-full max-w-md rounded-xl p-6 shadow-2xl">
        <h3 className="text-foreground mb-2 text-lg font-bold">{title}</h3>
        <p className="text-foreground/70 mb-6 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border-border text-foreground/80 hover:bg-background rounded-lg border px-4 py-2 text-sm transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm text-white transition-colors disabled:opacity-50 ${
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-gold hover:bg-gold-light"
            }`}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
