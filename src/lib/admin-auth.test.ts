import { describe, it, expect, beforeEach } from "vitest";
import {
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  changeAdminPassword,
} from "./admin-auth";

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

  it("tự động hủy phiên đăng nhập khi session đã hết hạn (expiresAt trong quá khứ)", () => {
    loginAdmin("admin", "admin123", true);
    expect(getAdminSession()).not.toBeNull();

    // Giả lập session cũ đã hết hạn
    const expiredUser = {
      username: "admin",
      name: "Quản trị viên trưởng",
      role: "Super Admin",
      loggedInAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    localStorage.setItem("liseamade.admin.auth.v1", JSON.stringify(expiredUser));

    expect(getAdminSession()).toBeNull();
    expect(localStorage.getItem("liseamade.admin.auth.v1")).toBeNull();
  });

  it("khóa đăng nhập tạm thời khi nhập sai quá 5 lần liên tiếp", () => {
    for (let i = 0; i < 5; i++) {
      const res = loginAdmin("admin", "sai_pass");
      expect(res.success).toBe(false);
    }

    // Lần thứ 6: bị khóa
    const lockedRes = loginAdmin("admin", "admin123");
    expect(lockedRes.success).toBe(false);
    expect(lockedRes.error).toContain("Đăng nhập bị khóa tạm thời");
  });

  it("cho phép đổi mật khẩu quản trị viên an toàn", () => {
    // Đổi mật khẩu admin sang pass mới
    const failRes = changeAdminPassword("admin", "wrong_old_pass", "newSecret2026");
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain("Mật khẩu hiện tại không chính xác");

    const successRes = changeAdminPassword("admin", "admin123", "newSecret2026");
    expect(successRes.success).toBe(true);

    // Đăng nhập bằng pass cũ thất bại
    const loginOld = loginAdmin("admin", "admin123");
    expect(loginOld.success).toBe(false);

    // Đăng nhập bằng pass mới thành công
    const loginNew = loginAdmin("admin", "newSecret2026");
    expect(loginNew.success).toBe(true);
    expect(loginNew.user?.username).toBe("admin");
  });
});
