import { useState, useEffect } from "react";

export interface AdminUser {
  username: string;
  name: string;
  role: string;
  loggedInAt: string;
  expiresAt: string;
}

const STORAGE_KEY_AUTH = "liseamade.admin.auth.v1";
const STORAGE_KEY_ATTEMPTS = "liseamade.admin.login.attempts.v1";
const AUTH_EVENT = "liseamade:admin-auth";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

// Tài khoản demo local. Production phải thay bằng backend auth + HttpOnly cookie.
const VALID_CREDENTIALS: Record<string, { pass: string; name: string; role: string }> = {
  admin: {
    pass: "admin123",
    name: "Quản trị viên trưởng",
    role: "Super Admin",
  },
  lisea: {
    pass: "hawaii2026",
    name: "Lisea Made Team",
    role: "Store Manager",
  },
};

interface LoginAttempts {
  count: number;
  lockedUntil?: number;
}

function getStorage(remember = false): Storage | null {
  if (typeof window === "undefined") return null;
  return remember ? window.localStorage : window.sessionStorage;
}

function isValidSession(value: unknown): value is AdminUser {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.username === "string" &&
    typeof session.name === "string" &&
    typeof session.role === "string" &&
    typeof session.loggedInAt === "string" &&
    typeof session.expiresAt === "string" &&
    Number.isFinite(Date.parse(session.expiresAt)) &&
    Date.parse(session.expiresAt) > Date.now()
  );
}

function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY_AUTH);
  window.localStorage.removeItem(STORAGE_KEY_AUTH);
}

function readStoredSession(storage: Storage): AdminUser | null {
  const raw = storage.getItem(STORAGE_KEY_AUTH);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getAttempts(): LoginAttempts {
  if (typeof window === "undefined") return { count: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const parsed = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== "object" || parsed === null) return { count: 0 };
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      lockedUntil: typeof parsed.lockedUntil === "number" ? parsed.lockedUntil : undefined,
    };
  } catch {
    return { count: 0 };
  }
}

function setAttempts(value: LoginAttempts): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(value));
}

function clearAttempts(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
}

function registerFailedAttempt(): void {
  const current = getAttempts();
  const count = current.count + 1;
  setAttempts({
    count,
    lockedUntil: count >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : undefined,
  });
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const session = readStoredSession(window.sessionStorage) ?? readStoredSession(window.localStorage);
  if (!session) {
    clearStoredSession();
  }
  return session;
}

export function loginAdmin(
  usernameInput: string,
  passwordInput: string,
  rememberMe = true
): { success: boolean; user?: AdminUser; error?: string } {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!username || !password) {
    return { success: false, error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." };
  }

  const attempts = getAttempts();
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return { success: false, error: `Đăng nhập bị khóa tạm thời. Thử lại sau ${minutes} phút.` };
  }

  const account = VALID_CREDENTIALS[username];
  if (!account || account.pass !== password) {
    registerFailedAttempt();
    return { success: false, error: "Tên đăng nhập hoặc mật khẩu không chính xác." };
  }

  clearAttempts();

  const now = Date.now();
  const user: AdminUser = {
    username,
    name: account.name,
    role: account.role,
    loggedInAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };

  if (typeof window !== "undefined") {
    const storage = getStorage(rememberMe) || window.localStorage;
    storage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    if (rememberMe) {
      window.sessionStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      window.localStorage.removeItem(STORAGE_KEY_AUTH);
    }
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }

  return { success: true, user };
}

export function logoutAdmin(): void {
  if (typeof window !== "undefined") {
    clearStoredSession();
    clearAttempts();
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(() => getAdminSession());

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getAdminSession());
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return {
    isAuthenticated: Boolean(user),
    user,
    login: loginAdmin,
    logout: logoutAdmin,
  };
}
