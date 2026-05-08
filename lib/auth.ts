export type CurrentUser = {
  username: string;
  loggedInAt: string;
};

type AuthResult = {
  ok: boolean;
  message: string;
  user?: CurrentUser;
};

const CURRENT_USER_KEY = "acorn_current_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export async function signup(username: string, password: string): Promise<AuthResult> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim(), password }),
  });
  const result = (await response.json()) as AuthResult;

  return result;
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim(), password }),
  });
  const result = (await response.json()) as AuthResult;

  if (result.ok && result.user && isBrowser()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));
    window.dispatchEvent(new Event("acorn-auth-changed"));
  }

  return result;
}

export function logout() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event("acorn-auth-changed"));
}

export function getCurrentUser() {
  if (!isBrowser()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(CURRENT_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as CurrentUser;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}
