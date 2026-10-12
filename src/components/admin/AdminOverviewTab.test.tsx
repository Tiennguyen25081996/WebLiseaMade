import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminOverviewTab } from "./AdminOverviewTab";
import type { Product, Category, PlacedOrder } from "@/types";
import type { DiscountEvent } from "@/lib/admin-store";

const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Sản phẩm 1",
    price: 200000,
    category: "ao",
    images: ["/img.jpg"],
    shortDescription: "Short",
    description: "Desc",
    materials: ["Cotton"],
    variants: [{ id: "v1", label: "M", kind: "size", inStock: true }],
    rating: 5,
    reviewCount: 1,
    badges: [],
  },
];

const mockCategories: Category[] = [
  { id: "ao", name: "Áo thời trang", description: "Mô tả" },
];

const mockDiscounts: DiscountEvent[] = [
  {
    id: "d1",
    code: "SUMMER",
    name: "Hè rực rỡ",
    type: "percentage",
    value: 10,
    minOrderValue: 100000,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    isActive: true,
  },
];

const mockOrders: PlacedOrder[] = [
  {
    code: "LM-TEST01",
    createdAt: "2026-10-10T10:00:00.000Z",
    status: "pending",
    lines: [],
    totals: {
      subtotal: 200000,
      shippingFee: 30000,
      discount: 0,
      total: 230000,
    },
    info: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      email: "a@gmail.com",
      address: "123 Đường Láng",
      province: "Hà Nội",
      district: "Đống Đa",
      note: "",
      paymentMethod: "cod",
    },
  },
];

describe("AdminOverviewTab", () => {
  it("hiển thị số liệu tổng quan sản phẩm, danh mục, voucher và doanh thu", () => {
    const onNavigateTab = vi.fn();
    const onOpenNewProduct = vi.fn();
    const onOpenNewDiscount = vi.fn();

    render(
      <AdminOverviewTab
        products={mockProducts}
        categories={mockCategories}
        discounts={mockDiscounts}
        orders={mockOrders}
        onNavigateTab={onNavigateTab}
        onOpenNewProduct={onOpenNewProduct}
        onOpenNewDiscount={onOpenNewDiscount}
      />
    );

    expect(screen.getByText("Tổng sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Phân loại nhóm hàng")).toBeInTheDocument();
    expect(screen.getByText("Khuyến mãi kích hoạt")).toBeInTheDocument();
    expect(screen.getByText("Đơn hàng & Doanh thu")).toBeInTheDocument();
  });

  it("gọi các callback tương ứng khi bấm thao tác nhanh", () => {
    const onNavigateTab = vi.fn();
    const onOpenNewProduct = vi.fn();
    const onOpenNewDiscount = vi.fn();

    render(
      <AdminOverviewTab
        products={mockProducts}
        categories={mockCategories}
        discounts={mockDiscounts}
        orders={mockOrders}
        onNavigateTab={onNavigateTab}
        onOpenNewProduct={onOpenNewProduct}
        onOpenNewDiscount={onOpenNewDiscount}
      />
    );

    const addProductBtn = screen.getByRole("button", { name: /\+ Thêm sản phẩm mới/ });
    fireEvent.click(addProductBtn);
    expect(onNavigateTab).toHaveBeenCalledWith("products");
    expect(onOpenNewProduct).toHaveBeenCalled();

    const addDiscountBtn = screen.getByRole("button", { name: /\+ Tạo mã giảm giá/ });
    fireEvent.click(addDiscountBtn);
    expect(onNavigateTab).toHaveBeenCalledWith("discounts");
    expect(onOpenNewDiscount).toHaveBeenCalled();

    const mediaBtn = screen.getByRole("button", { name: /Tải ảnh Cloudflare/ });
    fireEvent.click(mediaBtn);
    expect(onNavigateTab).toHaveBeenCalledWith("media");
  });
});
