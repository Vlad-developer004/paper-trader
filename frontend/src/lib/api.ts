const TOKEN_KEY = "paper-trader-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

// A generic, user-facing message — never surface a raw fetch/parse exception (e.g. "Unexpected
// end of JSON input") to the UI, since that only means something like "the backend is down" or
// "the network dropped", not anything the user did wrong.
const UNREACHABLE_MESSAGE = "Can't reach the server right now. Please try again in a moment.";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }

  let body: ApiResult<T>;
  try {
    body = (await res.json()) as ApiResult<T>;
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }

  if (!body.success) throw new Error(body.error);
  return body.data;
}
