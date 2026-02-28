import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
