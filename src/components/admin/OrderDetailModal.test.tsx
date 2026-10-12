import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderDetailModal } from "./OrderDetailModal";
import type { PlacedOrder } from "@/types";

const mockOrder: PlacedOrder = {
  code: "LM-MODAL99",
  createdAt: "2026-10-10T10:00:00.000Z",
  status: "pending",
  lines: [
    {
      productId: "ao-linen",
      variantId: "v-s",
      quantity: 1,
      unitPrice: 250000,
      lineTotal: 250000,
      product: {
        id: "ao-linen",
        name: "Áo đũi thêu tay",
        price: 250000,
        category: "ao",
        images: ["/test.jpg"],
        shortDescription: "Áo đũi",
        description: "Mô tả",
        materials: ["Đũi"],
        variants: [],
        rating: 5,
        reviewCount: 1,
        badges: [],
      },
      variant: { id: "v-s", label: "Size S", kind: "size", inStock: true },
    },
  ],
  totals: {
    subtotal: 250000,
    shippingFee: 20000,
    discount: 50000,
    total: 220000,
  },
  info: {
    fullName: "Lê Hoàng Nam",
    phone: "0912345678",
    email: "nam@gmail.com",
    address: "789 Điện Biên Phủ, Bình Thạnh",
    province: "TP.HCM",
    district: "Bình Thạnh",
    note: "Giao giờ hành chính",
    paymentMethod: "cod",
  },
};

describe("OrderDetailModal", () => {
  it("không render gì khi order là null", () => {
    const onClose = vi.fn();
    const { container } = render(<OrderDetailModal order={null} onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it("render đầy đủ thông tin đơn hàng, sản phẩm và tổng tiền", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={mockOrder} onClose={onClose} />);

    expect(screen.getByText("Mã: LM-MODAL99")).toBeInTheDocument();
    expect(screen.getByText("Lê Hoàng Nam")).toBeInTheDocument();
    expect(screen.getByText("0912345678")).toBeInTheDocument();
    expect(screen.getByText(/789 Điện Biên Phủ/)).toBeInTheDocument();
    expect(screen.getByText(/Giao giờ hành chính/)).toBeInTheDocument();
    expect(screen.getByText("Áo đũi thêu tay")).toBeInTheDocument();
  });

  it("gọi onClose khi bấm nút đóng hoặc nút Đóng", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={mockOrder} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Đóng chi tiết đơn" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const bottomCloseBtn = screen.getByRole("button", { name: "Đóng" });
    fireEvent.click(bottomCloseBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("gọi onUpdateShipping khi nhập mã vận đơn SPX và bấm Lưu mã vận đơn", () => {
    const onClose = vi.fn();
    const onUpdateShipping = vi.fn();
    render(
      <OrderDetailModal
        order={mockOrder}
        onClose={onClose}
        onUpdateShipping={onUpdateShipping}
      />
    );

    const input = screen.getByPlaceholderText(/VD: SPXVN.../i);
    fireEvent.change(input, { target: { value: "SPXVN012345678" } });

    const saveBtn = screen.getByRole("button", { name: /Lưu mã vận đơn/i });
    fireEvent.click(saveBtn);

    expect(onUpdateShipping).toHaveBeenCalledWith("LM-MODAL99", {
      trackingCode: "SPXVN012345678",
      carrier: "spx",
    });
    expect(screen.getByText("Đã lưu ✓")).toBeInTheDocument();
  });
});
