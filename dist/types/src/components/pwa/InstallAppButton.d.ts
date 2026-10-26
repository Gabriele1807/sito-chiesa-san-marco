/**
 * Link "Installa l'app" sempre raggiungibile (footer), anche dopo aver
 * chiuso l'invito automatico. Non compare se il browser non permette
 * l'installazione o se l'app è già aperta come installata.
 */
export default function InstallAppButton({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element | null;
