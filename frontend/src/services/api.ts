const API_BASE = "/api";
let authToken: string | null = null;
let auditActorEmpNo = "EMP001";
let auditActorRole = "Office";

export class ApiError extends Error {
  status: number;
  statusText: string;
  body?: unknown;

  constructor(status: number, statusText: string, body?: unknown) {
    super(`API error: ${status} ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (auditActorEmpNo) {
    headers["X-Actor-EmpNo"] = auditActorEmpNo;
  }
  if (auditActorRole) {
    headers["X-Actor-Role"] = auditActorRole;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      /* empty */
    }
    throw new ApiError(res.status, res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function setApiAuditActor(empNo: string | null, role: string | null) {
  auditActorEmpNo = empNo?.trim() || "UNKNOWN";
  auditActorRole = role?.trim() || "Unknown";
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  deleteWithBody: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "DELETE", body: JSON.stringify(body) }),
};
