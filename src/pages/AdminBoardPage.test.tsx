import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminBoardPage from "./AdminBoardPage";
import { loginAdmin } from "@/lib/admin-auth";

describe("AdminBoardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("hiển thị màn hình đăng nhập khi chưa có phiên đăng nhập", () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Đăng nhập Quản Trị Viên")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập hệ thống" })).toBeInTheDocument();
  });

  it("báo lỗi khi nhập sai tài khoản hoặc mật khẩu trên form đăng nhập", async () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const userInput = screen.getByLabelText("Tên đăng nhập");
    const passInput = screen.getByLabelText("Mật khẩu");
    const submitBtn = screen.getByRole("button", { name: "Đăng nhập hệ thống" });

    fireEvent.change(userInput, { target: { value: "admin" } });
    fireEvent.change(passInput, { target: { value: "sai_mat_khau" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Tên đăng nhập hoặc mật khẩu không chính xác.");
    });
  });

  it("cho phép đăng nhập thành công khi nhập đúng tài khoản quản trị", async () => {
    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const userInput = screen.getByLabelText("Tên đăng nhập");
    const passInput = screen.getByLabelText("Mật khẩu");
    fireEvent.change(userInput, { target: { value: "admin" } });
    fireEvent.change(passInput, { target: { value: "admin123" } });

    const submitBtn = screen.getByRole("button", { name: "Đăng nhập hệ thống" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Quản trị LiseaMade")).toBeInTheDocument();
      expect(screen.getByText("Admin Console")).toBeInTheDocument();
    });
  });

  it("render tiêu đề quản trị và các thẻ thống kê khi đã đăng nhập", () => {
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Quản trị LiseaMade")).toBeInTheDocument();
    expect(screen.getByText("Tổng sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Phân loại nhóm hàng")).toBeInTheDocument();
    expect(screen.getByText("Khuyến mãi kích hoạt")).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng & Doanh thu")).toBeInTheDocument();
  });

  it("chuyển tab sang Sản phẩm và hiển thị nút thêm sản phẩm", () => {
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const prodTabButton = screen.getByRole("button", { name: /Sản phẩm \(/ });
    fireEvent.click(prodTabButton);

    expect(screen.getByRole("button", { name: "+ Thêm sản phẩm" })).toBeInTheDocument();
  });

  it("chuyển tab sang Loại sản phẩm và hiển thị nút thêm loại sản phẩm", () => {
    loginAdmin("admin", "admin123", true);

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
    loginAdmin("admin", "admin123", true);

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
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const prodTabButton = screen.getByRole("button", { name: /Sản phẩm \(/ });
    fireEvent.click(prodTabButton);

    const addProductBtn = screen.getByRole("button", { name: "+ Thêm sản phẩm" });
    fireEvent.click(addProductBtn);

    expect(screen.getByText("Thêm sản phẩm mới")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên sản phẩm/i)).toBeInTheDocument();
  });

  it("chuyển tab sang Ảnh Cloudflare (Media) và hiển thị khu vực tải ảnh", async () => {
    loginAdmin("admin", "admin123", true);

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
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const prodTabButton = screen.getByRole("button", { name: /Sản phẩm \(/ });
    fireEvent.click(prodTabButton);

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
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const prodTabButton = screen.getByRole("button", { name: /Sản phẩm \(/ });
    fireEvent.click(prodTabButton);

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

    // Ảnh trên dòng sản phẩm trong bảng đã được cập nhật
    const updatedImg = screen.getByRole("img", { name: "Áo sơ mi hoa dừa" });
    expect(updatedImg).toHaveAttribute("src", "/api/images/test-image-123.jpg");
  });

  it("chuyển sang tab Đơn hàng và hiển thị bộ lọc đơn", () => {
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const ordersTabBtn = screen.getByRole("button", { name: /Đơn hàng \(/ });
    fireEvent.click(ordersTabBtn);

    expect(screen.getByPlaceholderText(/Tìm đơn theo mã, tên khách/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Làm mới đơn/ })).toBeInTheDocument();
  });

  it("chuyển sang tab Cài đặt Trang chủ và hiển thị giao diện cấu hình", () => {
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const homeTabBtn = screen.getByRole("button", { name: /Cài đặt Trang chủ/ });
    fireEvent.click(homeTabBtn);

    expect(screen.getByText("Cài đặt hình ảnh & nội dung Trang chủ")).toBeInTheDocument();
    expect(screen.getByText(/1\. Banner Hero/)).toBeInTheDocument();
  });

  it("chuyển sang tab Chatbot AI và hiển thị cấu hình bot", () => {
    loginAdmin("admin", "admin123", true);

    render(
      <MemoryRouter>
        <AdminBoardPage />
      </MemoryRouter>
    );

    const chatbotTabBtn = screen.getByRole("button", { name: /Chatbot AI/ });
    fireEvent.click(chatbotTabBtn);

    expect(screen.getByText("Cấu hình Chatbot AI Tư Vấn Bán Hàng")).toBeInTheDocument();
    expect(screen.getByText("Thử nghiệm Chatbot Sandbox")).toBeInTheDocument();
  });
});
