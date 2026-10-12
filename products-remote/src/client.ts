const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = sessionStorage.getItem("accessToken");
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.text();
  if (!response.ok) {
    let message = body || response.statusText;
    try {
      const parsed = JSON.parse(body) as { message?: string; detail?: string };
      message = parsed.message || parsed.detail || message;
    } catch {
      // Preserve plain-text error responses.
    }
    throw new Error(`${response.status}: ${message}`);
  }

  return body ? JSON.parse(body) as T : undefined as T;
}