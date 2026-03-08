import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface RequireRoleProps {
  children: ReactNode;
  roles: string[];
}

export function RequireRole({ children, roles }: RequireRoleProps) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const hasRole = session.roles.some((role) =>
    roles.some((requiredRole) => requiredRole.localeCompare(role, undefined, { sensitivity: "accent" }) === 0)
  );
  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
