import { api } from "./api";
import type { AuthSession, OperatorPreLoginResponse } from "../types/auth";

export const authApi = {
  operatorPreLogin: (empNo: string) =>
    api.post<OperatorPreLoginResponse>("/auth/operator/prelogin", { empNo }),
  operatorLogin: (payload: {
    empNo: string;
    password?: string | null;
    siteId?: number | null;
    workCenterId?: number | null;
  }) => api.post<AuthSession>("/auth/operator/login", payload),
  microsoftLogin: (idToken: string) => api.post<AuthSession>("/auth/microsoft/login", { idToken }),
  getSession: () => api.get<AuthSession>("/auth/session"),
  logout: () => api.post<void>("/auth/logout", {}),
};
