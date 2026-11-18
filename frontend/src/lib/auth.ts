// Keeps the login token in the browser and attaches it to requests.
//
// The token is stored in localStorage: simple, and it survives a page refresh. The cost is that
// any script running on the page could read it, which is acceptable for this sample UI
// (see decisions A18). Next.js renders pages on the server first, where localStorage does not
// exist, so these functions must only be called from the browser (inside effects or handlers).

import { ApiError, apiFetch, type HttpMethod } from "@/lib/api";

const TOKEN_KEY = "synoras_token";

export type User = {
  user_id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  auto_memory: boolean;
};

type TokenResponse = { access_token: string; token_type: string };
type RegisterResponse = TokenResponse & { user: User };

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage can be blocked (private mode): act as "not logged in"
  }
}

function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore: the user will simply have to log in again after a refresh
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// Creating an account also logs you in (SRS UC-1): the backend sends a token with the new user.
export async function register(name: string, email: string, password: string): Promise<User> {
  const result = await apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
  setToken(result.access_token);
  return result.user;
}

export async function login(email: string, password: string): Promise<void> {
  const result = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(result.access_token);
}

export function logout(): void {
  clearToken();
}

// Like apiFetch, but adds the stored token. Use this for every page that needs a login.
// If the backend says the token is no good (401), it is thrown away, so nobody keeps using it.
export async function authFetch<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Not logged in.");
  try {
    return await apiFetch<T>(path, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearToken();
    throw error;
  }
}

export function fetchMe(): Promise<User> {
  return authFetch<User>("/auth/me");
}
