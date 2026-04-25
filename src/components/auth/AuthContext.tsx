"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserSessionInfo, AdminSessionInfo } from "@/types";

// --------------- Types ---------------

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

const AuthContext = createContext<AuthContextValue | null>(null);

// --------------- Provider ---------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    type: "guest",
    loading: true,
    user: null,
    admin: null,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isExplicitGuest, setIsExplicitGuestRaw] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("explicit_guest") === "true";
    }
    return false;
  });

  const setIsExplicitGuest = useCallback((v: boolean) => {
    setIsExplicitGuestRaw(v);
    if (v) {
      localStorage.setItem("explicit_guest", "true");
    } else {
      localStorage.removeItem("explicit_guest");
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      // Stato sessione sempre dal server per evitare ruoli admin stale in localStorage.
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success && data.type === "admin") {
        setIsExplicitGuest(false);
        if (data.admin) {
          localStorage.setItem("admin_info", JSON.stringify(data.admin));
        }
        setState({
          type: "admin",
          loading: false,
          user: null,
          admin: data.admin ? {
            id: data.admin.id || "",
            username: data.admin.username || "",
            nome: data.admin.nome,
            cognome: data.admin.cognome,
            ruolo: data.admin.ruolo,
            isAdmin: true,
          } : null,
        });
      } else if (data.success && data.type === "user" && data.user) {
        setIsExplicitGuest(false);
        localStorage.removeItem("admin_info");
        setState({
          type: "user",
          loading: false,
          user: data.user as UserSessionInfo,
          admin: null,
        });
      } else {
        localStorage.removeItem("admin_info");
        setState({
          type: "guest",
          loading: false,
          user: null,
          admin: null,
        });
      }
    } catch {
      localStorage.removeItem("admin_info");
      setState({
        type: "guest",
        loading: false,
        user: null,
        admin: null,
      });
    }
  }, [setIsExplicitGuest]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      if (state.type === "admin") {
        await fetch("/api/admin/logout", { method: "POST" });
        localStorage.removeItem("admin_info");
      } else if (state.type === "user") {
        await fetch("/api/auth/logout", { method: "POST" });
      }
    } catch {
      // ignora errori di rete
    }
    localStorage.removeItem("user_info");
    setState({
      type: "guest",
      loading: false,
      user: null,
      admin: null,
    });
  }, [state.type]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        showLoginModal,
        setShowLoginModal,
        showRegisterModal,
        setShowRegisterModal,
        isExplicitGuest,
        setIsExplicitGuest,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --------------- Hook ---------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve essere usato dentro <AuthProvider>");
  }
  return ctx;
}
