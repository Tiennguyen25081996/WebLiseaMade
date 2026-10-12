import { describe, it, expect, beforeEach } from "vitest";
import { getAdminSession, loginAdmin, logoutAdmin } from "./admin-auth";

describe("admin-auth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("trả về null khi chưa đăng nhập", () => {
    expect(getAdminSession()).toBeNull();
  });

  it("báo lỗi khi để trống tài khoản hoặc mật khẩu", () => {
    const res = loginAdmin("", "");
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("báo lỗi khi nhập sai mật khẩu", () => {
    const res = loginAdmin("admin", "wrongpass");
    expect(res.success).toBe(false);
    expect(res.error).toContain("không chính xác");
    expect(getAdminSession()).toBeNull();
  });

  it("đăng nhập thành công với tài khoản mặc định admin / admin123", () => {
    const res = loginAdmin("admin", "admin123", true);
    expect(res.success).toBe(true);
    expect(res.user?.username).toBe("admin");
    expect(res.user?.role).toBe("Super Admin");

    const session = getAdminSession();
    expect(session?.username).toBe("admin");
  });

  it("đăng nhập không lưu rememberMe thì lưu vào sessionStorage", () => {
    const res = loginAdmin("lisea", "hawaii2026", false);
    expect(res.success).toBe(true);
    expect(sessionStorage.getItem("liseamade.admin.auth.v1")).not.toBeNull();
    expect(localStorage.getItem("liseamade.admin.auth.v1")).toBeNull();
  });

  it("đăng xuất xóa sạch phiên làm việc", () => {
    loginAdmin("admin", "admin123", true);
    expect(getAdminSession()).not.toBeNull();

    logoutAdmin();
    expect(getAdminSession()).toBeNull();
  });
});
