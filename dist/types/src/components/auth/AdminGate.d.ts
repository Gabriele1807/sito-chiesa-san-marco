interface AdminGateProps {
    children: React.ReactNode;
    title: string;
    description?: string;
}
/**
 * Wrapper che mostra COMING SOON se l'utente non è admin.
 * Se è admin, mostra il contenuto normalmente.
 */
export default function AdminGate({ children, title, description, }: AdminGateProps): import("react/jsx-runtime").JSX.Element;
export {};
