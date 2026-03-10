import { ApiError } from "../services/api";

export function extractApiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string } | undefined;
    if (body?.message) {
      return body.message;
    }
    return `${error.status} ${error.statusText}`;
  }
  return fallback;
}
