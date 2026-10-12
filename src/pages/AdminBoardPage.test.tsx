import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("chuyển tab sang Ảnh Cloudflare (Media) và hiển thị khu vực tải ảnh", async () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const mediaTabBtn = screen.getByRole("button", { name: /Ảnh Cloudflare/ });
    fireEvent.click(mediaTabBtn);

    expect(screen.getByText("Cloudflare Media Hub")).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả ảnh vào đây hoặc nhấp để tải lên/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Chọn ảnh từ máy/ })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Đang đồng bộ ảnh từ Cloudflare...")).not.toBeInTheDocument();
    });
  });

  it("mở modal Cloudflare Media Picker từ form thêm sản phẩm", async () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const addProductBtn = screen.getByRole("button", { name: "+ Thêm sản phẩm" });
    fireEvent.click(addProductBtn);

    const openPickerBtn = screen.getByRole("button", { name: /Tải \/ Chọn từ Cloudflare/i });
    fireEvent.click(openPickerBtn);

    expect(
      screen.getByText(/Tải ảnh mới hoặc bấm "Chọn" trên ảnh để tự động thêm vào sản phẩm/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Đang đồng bộ ảnh từ Cloudflare...")).not.toBeInTheDocument();
    });
  });

  it("mở modal sửa sản phẩm, đổi link ảnh và bấm Lưu thay đổi thành công", async () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminBoardPage />
      </MemoryRouter>
    );

    // Bấm nút sửa của sản phẩm đầu tiên
    const editBtns = screen.getAllByRole("button", { name: "Sửa" });
    fireEvent.click(editBtns[0]);

    expect(screen.getByText("Chỉnh sửa sản phẩm")).toBeInTheDocument();

    // Sửa link ảnh
    const imageInput = screen.getByLabelText(/Đường dẫn ảnh/i);
    fireEvent.change(imageInput, { target: { value: "/api/images/test-image-123.jpg" } });

    // Bấm Lưu thay đổi (Button type="submit")
    const saveBtn = screen.getByRole("button", { name: "Lưu thay đổi" });
    expect(saveBtn).toHaveAttribute("type", "submit");
    fireEvent.click(saveBtn);

    // Modal phải đóng lại sau khi lưu
    await waitFor(() => {
      expect(screen.queryByText("Chỉnh sửa sản phẩm")).not.toBeInTheDocument();
    });

    // Thông báo toast thành công xuất hiện
    expect(screen.getByText("Đã cập nhật sản phẩm thành công!")).toBeInTheDocument();
  });
});
