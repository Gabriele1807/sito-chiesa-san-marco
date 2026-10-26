import { type ReactNode } from "react";
import type { UserSessionInfo, AdminSessionInfo } from "@/types";
type AuthType = "guest" | "user" | "admin";
interface AuthState {
    type: AuthType;
    loading: boolean;
    user: UserSessionInfo | null;
    admin: AdminSessionInfo | null;
}
interface AuthContextValue extends AuthState {
    /** Apre/chiude la modal di login */
    showLoginModal: boolean;
    setShowLoginModal: (v: boolean) => void;
    /** Apre/chiude la modal di registrazione */
    showRegisterModal: boolean;
    setShowRegisterModal: (v: boolean) => void;
    /** L'utente ha scelto esplicitamente di continuare come ospite */
    isExplicitGuest: boolean;
    setIsExplicitGuest: (v: boolean) => void;
    /** Ricarica lo stato autenticazione */
    refresh: () => Promise<void>;
    /** Logout utente o admin */
    logout: () => Promise<void>;
}
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextValue;
export {};
