import { useEffect, useState } from "react";

const TOKEN_KEY = "paper-trader-token";
const AUTH_CHANGE_EVENT = "paper-trader-auth-change";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function useAuthToken(): string | null {
  const [token, setTokenState] = useState(getToken);

  useEffect(() => {
    const sync = () => setTokenState(getToken());
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return token;
}

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

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
