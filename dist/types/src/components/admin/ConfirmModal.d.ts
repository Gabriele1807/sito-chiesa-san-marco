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
export default function ConfirmModal({ open, title, message, onConfirm, onCancel, loading, confirmLabel, loadingLabel, tone, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
