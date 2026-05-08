export type StoredUser = {
  username: string;
  password: string;
  createdAt: string;
};

const USERS_KEY = "acorn_users";
const CURRENT_USER_KEY = "acorn_current_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getUsers(): StoredUser[] {
  if (!isBrowser()) {
    return [];
  }

  const rawUsers = window.localStorage.getItem(USERS_KEY);

  if (!rawUsers) {
    return [];
  }

  try {
    return JSON.parse(rawUsers) as StoredUser[];
  } catch {
    return [];
  }
}

export function signup(username: string, password: string) {
  const users = getUsers();
  const trimmedUsername = username.trim();

  if (users.some((user) => user.username === trimmedUsername)) {
    return { ok: false, message: "이미 사용 중인 아이디입니다." };
  }

  const nextUser: StoredUser = {
    username: trimmedUsername,
    password,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(USERS_KEY, JSON.stringify([...users, nextUser]));
  return { ok: true, message: "회원가입이 완료되었습니다." };
}

export function login(username: string, password: string) {
  const trimmedUsername = username.trim();
  const user = getUsers().find(
    (storedUser) =>
      storedUser.username === trimmedUsername && storedUser.password === password,
  );

  if (!user) {
    return { ok: false, message: "아이디 또는 비밀번호를 확인해 주세요." };
  }

  window.localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({ username: user.username, loggedInAt: new Date().toISOString() }),
  );

  window.dispatchEvent(new Event("acorn-auth-changed"));
  return { ok: true, message: "로그인되었습니다." };
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
    return JSON.parse(rawUser) as { username: string; loggedInAt: string };
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}
