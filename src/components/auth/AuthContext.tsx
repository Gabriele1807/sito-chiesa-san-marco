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

  const refresh = useCallback(async () => {
    try {
      // Controlla prima se c'è info admin in localStorage (settata dal login admin)
      const adminInfoStr = typeof window !== "undefined" ? localStorage.getItem("admin_info") : null;
      if (adminInfoStr) {
        try {
          const adminInfo = JSON.parse(adminInfoStr);
          setState({
            type: "admin",
            loading: false,
            user: null,
            admin: {
              id: adminInfo.id || "",
              username: adminInfo.username || "",
              nome: adminInfo.nome,
              cognome: adminInfo.cognome,
              ruolo: adminInfo.ruolo,
              isAdmin: true,
            },
          });
          return;
        } catch {
          // JSON corrupto, ignora
        }
      }

      // Controlla sessione utente normale via API
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success && data.type === "admin") {
        // Ha cookie admin ma non ha localStorage - state admin minimale
        setState({
          type: "admin",
          loading: false,
          user: null,
          admin: null, // i dati verranno dal localStorage se disponibili
        });
      } else if (data.success && data.type === "user" && data.user) {
        setState({
          type: "user",
          loading: false,
          user: data.user as UserSessionInfo,
          admin: null,
        });
      } else {
        setState({
          type: "guest",
          loading: false,
          user: null,
          admin: null,
        });
      }
    } catch {
      setState({
        type: "guest",
        loading: false,
        user: null,
        admin: null,
      });
    }
  }, []);

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
