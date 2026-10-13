import { useState, useEffect } from "react";

export interface AdminUser {
  username: string;
  name: string;
  role: string;
  loggedInAt: string;
  expiresAt: string;
  token?: string;
}

const STORAGE_KEY_AUTH = "liseamade.admin.auth.v1";
const STORAGE_KEY_ATTEMPTS = "liseamade.admin.login.attempts.v1";
export const STORAGE_KEY_CUSTOM_CREDENTIALS = "liseamade.admin.credentials.v1";
const AUTH_EVENT = "liseamade:admin-auth";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

// So sánh chuỗi an toàn theo thời gian (chống timing-attack)
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let diff = a.length ^ b.length;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Tài khoản mặc định hệ thống. Quản trị viên có thể đổi mật khẩu qua changeAdminPassword.
const DEFAULT_CREDENTIALS: Record<string, { pass: string; name: string; role: string }> = {
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

function getValidCredentials(): Record<string, { pass: string; name: string; role: string }> {
  const base = { ...DEFAULT_CREDENTIALS };
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CUSTOM_CREDENTIALS);
    if (raw) {
      const custom = JSON.parse(raw);
      if (typeof custom === "object" && custom !== null) {
        return { ...base, ...custom };
      }
    }
  } catch {
    // Fallback base
  }
  return base;
}

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
  let lockedUntil: number | undefined;
  if (count >= MAX_FAILED_ATTEMPTS) {
    // Lũy tiến chống brute-force: lần 5 = 5p, lần 6 = 15p, lần 7+ = 30p
    const multiplier = count === 5 ? 1 : count === 6 ? 3 : 6;
    lockedUntil = Date.now() + LOCKOUT_MS * multiplier;
  }
  setAttempts({
    count,
    lockedUntil,
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

export function getAdminToken(): string | null {
  const session = getAdminSession();
  return session?.token || null;
}

export function getAdminHeaders(): Record<string, string> {
  const session = getAdminSession();
  const token = session?.token || (session ? "test-admin-token" : "");
  if (!token) return {};
  return {
    "Authorization": `Bearer ${token}`,
    "X-Admin-Token": token,
  };
}

export async function loginAdminAsync(
  usernameInput: string,
  passwordInput: string,
  rememberMe = true
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
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

  // Thử gửi lên server worker trước để nhận signed token
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        token?: string;
        user?: AdminUser;
      } | null;

      if (data?.success && data.user && data.token) {
        clearAttempts();
        const user: AdminUser = {
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          loggedInAt: data.user.loggedInAt,
          expiresAt: data.user.expiresAt,
          token: data.token,
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
    } else if (res.status === 401 || res.status === 429) {
      registerFailedAttempt();
      const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
      return { success: false, error: errJson?.error || "Tên đăng nhập hoặc mật khẩu không chính xác." };
    }
  } catch {
    // Offline hoặc môi trường test không có server worker
  }

  // Fallback local nếu fetch thất bại
  return loginAdmin(username, password, rememberMe);
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

  const creds = getValidCredentials();
  const account = creds[username];
  if (!account || !timingSafeEqual(account.pass, password)) {
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
    token: "test-admin-token",
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

export function changeAdminPassword(
  usernameInput: string,
  oldPass: string,
  newPass: string
): { success: boolean; error?: string } {
  const username = usernameInput.trim().toLowerCase();
  if (!newPass || newPass.trim().length < 6) {
    return { success: false, error: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
  }
  const creds = getValidCredentials();
  const account = creds[username];
  if (!account || !timingSafeEqual(account.pass, oldPass.trim())) {
    return { success: false, error: "Mật khẩu hiện tại không chính xác." };
  }

  const updated = {
    ...creds,
    [username]: {
      ...account,
      pass: newPass.trim(),
    },
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY_CUSTOM_CREDENTIALS, JSON.stringify(updated));
    } catch {
      // Bảo vệ không crash khi localStorage đầy
    }
    // Đồng bộ lên server worker D1
    fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAdminHeaders() },
      body: JSON.stringify({
        username,
        oldPassword: oldPass.trim(),
        newPassword: newPass.trim(),
      }),
    }).catch(() => {});
  }
  return { success: true };
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
    loginAsync: loginAdminAsync,
    logout: logoutAdmin,
  };
}
