import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminLoginForm } from "./AdminLoginForm";

describe("AdminLoginForm", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("render đúng các trường nhập liệu và nút đăng nhập", () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AdminLoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập hệ thống" })).toBeInTheDocument();
  });

  it("chuyển đổi ẩn/hiện mật khẩu khi click nút icon", () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AdminLoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const passInput = screen.getByLabelText("Mật khẩu") as HTMLInputElement;
    expect(passInput.type).toBe("password");

    const toggleBtn = screen.getByRole("button", { name: "Hiện mật khẩu" });
    fireEvent.click(toggleBtn);
    expect(passInput.type).toBe("text");

    const hideBtn = screen.getByRole("button", { name: "Ẩn mật khẩu" });
    fireEvent.click(hideBtn);
    expect(passInput.type).toBe("password");
  });

  it("điền nhanh tài khoản demo khi bấm nút mẫu", () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AdminLoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const demoBtn = screen.getByRole("button", { name: /Manager: lisea \/ hawaii2026/ });
    fireEvent.click(demoBtn);

    const userInput = screen.getByLabelText("Tên đăng nhập") as HTMLInputElement;
    const passInput = screen.getByLabelText("Mật khẩu") as HTMLInputElement;

    expect(userInput.value).toBe("lisea");
    expect(passInput.value).toBe("hawaii2026");
  });

  it("gọi onSuccess khi đăng nhập hợp lệ", async () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AdminLoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const demoBtn = screen.getByRole("button", { name: /Super Admin: admin \/ admin123/ });
    fireEvent.click(demoBtn);

    const submitBtn = screen.getByRole("button", { name: "Đăng nhập hệ thống" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "admin",
          role: "Super Admin",
        })
      );
    });
  });
});
