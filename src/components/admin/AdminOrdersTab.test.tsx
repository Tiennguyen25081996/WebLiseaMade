import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminOrdersTab } from "./AdminOrdersTab";
import type { PlacedOrder } from "@/types";

const mockOrders: PlacedOrder[] = [
  {
    code: "LM-TEST01",
    createdAt: "2026-10-10T10:00:00.000Z",
    status: "pending",
    lines: [
      {
        productId: "ao-1",
        variantId: "v-1",
        quantity: 2,
        product: {
          id: "ao-1",
          name: "Áo sơ mi lụa Hawaii",
          price: 350000,
          category: "ao",
          images: ["/test.jpg"],
          shortDescription: "Áo lụa",
          description: "Mô tả",
          materials: ["Lụa"],
          variants: [],
          rating: 5,
          reviewCount: 1,
          badges: [],
        },
        variant: { id: "v-1", label: "Size M", kind: "size", inStock: true },
        unitPrice: 350000,
        lineTotal: 700000,
      },
    ],
    totals: {
      subtotal: 700000,
      shippingFee: 30000,
      discount: 0,
      total: 730000,
    },
    info: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      email: "vana@gmail.com",
      address: "123 Lê Lợi, Q1, TP.HCM",
      province: "TP.HCM",
      district: "Quận 1",
      note: "",
      paymentMethod: "cod",
    },
  },
  {
    code: "LM-TEST02",
    createdAt: "2026-10-11T12:00:00.000Z",
    status: "delivered",
    lines: [],
    totals: {
      subtotal: 500000,
      shippingFee: 0,
      discount: 50000,
      total: 450000,
    },
    info: {
      fullName: "Trần Thị B",
      phone: "0987654321",
      email: "thib@gmail.com",
      address: "456 Nguyễn Huệ, Q1, TP.HCM",
      province: "TP.HCM",
      district: "Quận 1",
      note: "Gọi trước khi giao",
      paymentMethod: "bank-transfer",
    },
  },
];

describe("AdminOrdersTab", () => {
  it("render danh sách đơn hàng và thông tin khách hàng", () => {
    const onUpdateStatus = vi.fn();
    const onViewOrder = vi.fn();

    render(
      <AdminOrdersTab
        orders={mockOrders}
        onUpdateStatus={onUpdateStatus}
        onViewOrder={onViewOrder}
      />
    );

    expect(screen.getByText("LM-TEST01")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("LM-TEST02")).toBeInTheDocument();
    expect(screen.getByText("Trần Thị B")).toBeInTheDocument();
  });

  it("lọc đơn hàng theo từ khóa tìm kiếm", () => {
    const onUpdateStatus = vi.fn();
    const onViewOrder = vi.fn();

    render(
      <AdminOrdersTab
        orders={mockOrders}
        onUpdateStatus={onUpdateStatus}
        onViewOrder={onViewOrder}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm đơn theo mã/i);
    fireEvent.change(searchInput, { target: { value: "Trần Thị" } });

    expect(screen.queryByText("LM-TEST01")).not.toBeInTheDocument();
    expect(screen.getByText("LM-TEST02")).toBeInTheDocument();
  });

  it("lọc đơn hàng theo trạng thái dropdown", () => {
    const onUpdateStatus = vi.fn();
    const onViewOrder = vi.fn();

    render(
      <AdminOrdersTab
        orders={mockOrders}
        onUpdateStatus={onUpdateStatus}
        onViewOrder={onViewOrder}
      />
    );

    const filterSelect = screen.getByDisplayValue("Tất cả trạng thái");
    fireEvent.change(filterSelect, { target: { value: "delivered" } });

    expect(screen.queryByText("LM-TEST01")).not.toBeInTheDocument();
    expect(screen.getByText("LM-TEST02")).toBeInTheDocument();
  });

  it("gọi onUpdateStatus khi thay đổi trạng thái trong dòng đơn", () => {
    const onUpdateStatus = vi.fn();
    const onViewOrder = vi.fn();

    render(
      <AdminOrdersTab
        orders={mockOrders}
        onUpdateStatus={onUpdateStatus}
        onViewOrder={onViewOrder}
      />
    );

    const statusSelects = screen.getAllByRole("combobox");
    // statusSelects[0] là filter, statusSelects[1] là dropdown của đơn 1
    fireEvent.change(statusSelects[1], { target: { value: "processing" } });

    expect(onUpdateStatus).toHaveBeenCalledWith("LM-TEST01", "processing");
  });

  it("gọi onViewOrder khi bấm nút Chi tiết", () => {
    const onUpdateStatus = vi.fn();
    const onViewOrder = vi.fn();

    render(
      <AdminOrdersTab
        orders={mockOrders}
        onUpdateStatus={onUpdateStatus}
        onViewOrder={onViewOrder}
      />
    );

    const detailButtons = screen.getAllByRole("button", { name: "Chi tiết" });
    fireEvent.click(detailButtons[0]);

    expect(onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
  });
});
