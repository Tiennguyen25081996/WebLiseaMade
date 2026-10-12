import { useState, useEffect } from "react";

export interface AdminUser {
  username: string;
  name: string;
  role: string;
  loggedInAt: string;
}

const STORAGE_KEY_AUTH = "liseamade.admin.auth.v1";
const AUTH_EVENT = "liseamade:admin-auth";

// Tài khoản quản trị viên mặc định
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

function getStorage(remember = false): Storage | null {
  if (typeof window === "undefined") return null;
  return remember ? window.localStorage : window.sessionStorage;
}

export function getAdminSession(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    // Ưu tiên session hiện tại, nếu không có kiểm tra local lưu dài hạn
    const sessionRaw = window.sessionStorage.getItem(STORAGE_KEY_AUTH);
    if (sessionRaw) {
      return JSON.parse(sessionRaw) as AdminUser;
    }
    const localRaw = window.localStorage.getItem(STORAGE_KEY_AUTH);
    if (localRaw) {
      return JSON.parse(localRaw) as AdminUser;
    }
    return null;
  } catch {
    return null;
  }
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

  const account = VALID_CREDENTIALS[username];
  if (!account || account.pass !== password) {
    return { success: false, error: "Tên đăng nhập hoặc mật khẩu không chính xác." };
  }

  const user: AdminUser = {
    username,
    name: account.name,
    role: account.role,
    loggedInAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const storage = getStorage(rememberMe) || window.localStorage;
    storage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    // Dọn storage còn lại để không trùng lặp
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
    window.sessionStorage.removeItem(STORAGE_KEY_AUTH);
    window.localStorage.removeItem(STORAGE_KEY_AUTH);
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
