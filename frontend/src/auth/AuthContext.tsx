import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../services/auth";
import { setApiAuthToken } from "../services/api";
import type { AuthSession, OperatorPreLoginResponse } from "../types/auth";

const AUTH_TOKEN_STORAGE_KEY = "lpcmes.authToken";

interface AuthContextValue {
  isLoading: boolean;
  session: AuthSession | null;
  operatorPreLogin: (empNo: string) => Promise<OperatorPreLoginResponse>;
  microsoftLogin: (idToken: string) => Promise<AuthSession>;
  operatorLogin: (payload: {
    empNo: string;
    password?: string | null;
    siteId: number;
    workCenterId: number;
  }) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!token) {
        setApiAuthToken(null);
        setIsLoading(false);
        return;
      }

      setApiAuthToken(token);
      try {
        const currentSession = await authApi.getSession();
        setSession(currentSession);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setApiAuthToken(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      operatorPreLogin: async (empNo) => authApi.operatorPreLogin(empNo),
      microsoftLogin: async (idToken) => {
        const nextSession = await authApi.microsoftLogin(idToken);
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextSession.token);
        setApiAuthToken(nextSession.token);
        setSession(nextSession);
        return nextSession;
      },
      operatorLogin: async (payload) => {
        const nextSession = await authApi.operatorLogin(payload);
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextSession.token);
        setApiAuthToken(nextSession.token);
        setSession(nextSession);
        return nextSession;
      },
      logout: async () => {
        try {
          if (session?.token) {
            await authApi.logout();
          }
        } catch {
          // Best-effort logout; session is always cleared client-side.
        } finally {
          window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setApiAuthToken(null);
          setSession(null);
        }
      },
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
