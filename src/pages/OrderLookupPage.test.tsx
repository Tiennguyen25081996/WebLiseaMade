import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OrderLookupPage from "./OrderLookupPage";
import { saveOrder } from "@/lib/orders";
import type { PlacedOrder } from "@/types";

describe("OrderLookupPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("cho phép nhập mã đơn và hiển thị trạng thái cùng hành trình giao hàng", async () => {
    const mockOrder: PlacedOrder = {
      code: "LM-ABCD12",
      createdAt: new Date().toISOString(),
      status: "shipping",
      info: {
        fullName: "Lê Văn Cường",
        phone: "0933888999",
        email: "cuong@example.com",
        address: "789 Điện Biên Phủ",
        district: "Bình Thạnh",
        province: "TP. Hồ Chí Minh",
        note: "Gọi trước khi giao",
        paymentMethod: "cod",
      },
      lines: [
        {
          productId: "p1",
          variantId: "v1",
          quantity: 1,
          unitPrice: 380000,
          lineTotal: 380000,
          product: {
            id: "p1",
            name: "Áo sơ mi voan hoa Hawaii",
            category: "ao",
            price: 380000,
            compareAtPrice: 380000,
            images: [],
            variants: [{ id: "v1", label: "L", kind: "size", inStock: true }],
            shortDescription: "Sơ mi hè",
            description: "Sơ mi hè",
            materials: ["Voan"],
            badges: [],
            rating: 5,
            reviewCount: 2,
          },
          variant: { id: "v1", label: "L", kind: "size", inStock: true },
        },
      ],
      totals: {
        subtotal: 380000,
        shippingFee: 30000,
        discount: 0,
        total: 410000,
      },
    };

    saveOrder(mockOrder);

    render(
      <MemoryRouter initialEntries={["/tra-cuu-don"]}>
        <OrderLookupPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Tra cứu đơn hàng")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("LM-000000");
    fireEvent.change(input, { target: { value: "LM-ABCD12" } });

    const searchBtn = screen.getByRole("button", { name: /Tra cứu · Xác nhận/i });
    fireEvent.click(searchBtn);

    // Kết quả tra cứu chi tiết
    await waitFor(() => {
      expect(screen.getByText("Chi tiết đơn hàng")).toBeInTheDocument();
    });

    // Trạng thái đơn & Hành trình đi đến đâu
    expect(screen.getByText("Đang giao hàng")).toBeInTheDocument();
    expect(screen.getByText("Lê Văn Cường")).toBeInTheDocument();
    expect(screen.getByText(/789 Điện Biên Phủ, Bình Thạnh, TP\. Hồ Chí Minh/)).toBeInTheDocument();
    expect(screen.getByText("Đang ở chặng này")).toBeInTheDocument();

    // Nút điều hướng responsive
    const btnOther = screen.getByRole("button", { name: /Tra cứu đơn khác/i });
    const btnShop = screen.getByRole("link", { name: /Tiếp tục mua sắm →/i });

    expect(btnOther.className).toContain("w-full");
    expect(btnOther.className).toContain("sm:w-auto");
    expect(btnShop.className).toContain("w-full");
    expect(btnShop.className).toContain("sm:w-auto");
  });

  it("hiển thị thông báo không tìm thấy đơn khi nhập mã không tồn tại", async () => {
    render(
      <MemoryRouter initialEntries={["/tra-cuu-don?ma=LM-999999"]}>
        <OrderLookupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy đơn")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Nhập lại mã tra cứu/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem sản phẩm →/i })).toBeInTheDocument();
  });
});
