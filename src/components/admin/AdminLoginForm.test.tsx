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

  it("hiển thị thông báo bảo mật thay vì tài khoản demo lộ mật khẩu", () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AdminLoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Khu vực quản trị nội bộ bảo mật/i)
    ).toBeInTheDocument();
    // Đảm bảo không còn nút lộ mật khẩu trên màn hình
    expect(screen.queryByText(/admin123/)).not.toBeInTheDocument();
    expect(screen.queryByText(/hawaii2026/)).not.toBeInTheDocument();
  });

  it("gọi onSuccess khi đăng nhập hợp lệ với thông tin nhập từ form", async () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AdminLoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const userInput = screen.getByLabelText("Tên đăng nhập");
    const passInput = screen.getByLabelText("Mật khẩu");
    fireEvent.change(userInput, { target: { value: "admin" } });
    fireEvent.change(passInput, { target: { value: "admin123" } });

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
