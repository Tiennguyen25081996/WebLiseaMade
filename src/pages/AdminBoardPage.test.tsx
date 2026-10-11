import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminBoardPage from "./AdminBoardPage";

describe("AdminBoardPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("render tiêu đề quản trị và các thẻ thống kê", () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Quản trị LiseaMade")).toBeInTheDocument();
    expect(screen.getByText("Sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Loại sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Sự kiện giảm giá")).toBeInTheDocument();
  });

  it("chuyển tab sang Loại sản phẩm và hiển thị nút thêm loại sản phẩm", () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const catTabButton = screen.getByRole("button", { name: /Loại sản phẩm/ });
    fireEvent.click(catTabButton);

    expect(screen.getByRole("button", { name: "+ Thêm loại sản phẩm" })).toBeInTheDocument();
    expect(screen.getByText("Mã định danh (Slug)")).toBeInTheDocument();
  });

  it("chuyển tab sang Sự kiện giảm giá và hiển thị danh sách voucher", () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const discTabButton = screen.getByRole("button", { name: /Sự kiện giảm giá/ });
    fireEvent.click(discTabButton);

    expect(screen.getByRole("button", { name: "+ Thêm sự kiện giảm giá" })).toBeInTheDocument();
    expect(screen.getByText("SUMMER2026")).toBeInTheDocument();
  });

  it("mở modal thêm sản phẩm khi click + Thêm sản phẩm", () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const addProductBtn = screen.getByRole("button", { name: "+ Thêm sản phẩm" });
    fireEvent.click(addProductBtn);

    expect(screen.getByText("Thêm sản phẩm mới")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên sản phẩm/i)).toBeInTheDocument();
  });
});
