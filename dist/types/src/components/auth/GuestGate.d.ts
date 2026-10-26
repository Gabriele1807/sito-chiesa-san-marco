interface GuestGateProps {
    children: React.ReactNode;
    /** Messaggio da mostrare quando la sezione è bloccata */
    message?: string;
}
/**
 * Wrapper che scurisce e disabilita il contenuto per utenti ospiti (non autenticati).
 * Mostra un overlay con un messaggio e un click apre la modal di login.
 */
export default function GuestGate({ children, message, }: GuestGateProps): import("react/jsx-runtime").JSX.Element;
export {};
