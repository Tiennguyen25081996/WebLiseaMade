import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OrderSuccessPage from "./OrderSuccessPage";
import { saveOrder } from "@/lib/orders";
import type { PlacedOrder } from "@/types";

describe("OrderSuccessPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hiển thị thông báo khi mã đơn không tìm thấy", () => {
    render(
      <MemoryRouter initialEntries={["/dat-hang-thanh-cong?ma=UNKNOWN123"]}>
        <OrderSuccessPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Mã đơn không tìm thấy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tra cứu đơn" })).toBeInTheDocument();
  });

  it("hiển thị bộ 3 nút hành động với định dạng responsive khi đơn tồn tại", () => {
    const mockOrder: PlacedOrder = {
      code: "LM-TEST88",
      createdAt: new Date().toISOString(),
      info: {
        fullName: "Nguyễn Văn A",
        phone: "0901234567",
        email: "test@example.com",
        address: "123 Đường ABC",
        province: "Thành phố Hồ Chí Minh",
        district: "Quận 1",
        note: "",
        paymentMethod: "cod",
      },
      lines: [
        {
          productId: "p1",
          variantId: "v1",
          quantity: 1,
          unitPrice: 450000,
          lineTotal: 450000,
          product: {
            id: "p1",
            name: "Đầm Hawaii Hoa Vàng",
            category: "vay-dam",
            price: 450000,
            compareAtPrice: 450000,
            images: ["/test.jpg"],
            variants: [{ id: "v1", label: "M", kind: "size", inStock: true }],
            shortDescription: "Đầm hè",
            description: "Đầm hè đẹp",
            materials: ["Voan"],
            badges: [],
            rating: 5,
            reviewCount: 1,
          },
          variant: { id: "v1", label: "M", kind: "size", inStock: true },
        },
      ],
      totals: {
        subtotal: 450000,
        shippingFee: 30000,
        discount: 0,
        total: 480000,
      },
    };

    saveOrder(mockOrder);

    render(
      <MemoryRouter initialEntries={["/dat-hang-thanh-cong?ma=LM-TEST88"]}>
        <OrderSuccessPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Cảm ơn — đơn đã ghi nhận")).toBeInTheDocument();
    expect(screen.getByText(/Mã đơn LM-TEST88/)).toBeInTheDocument();

    // Bộ 3 button
    const btnShop = screen.getByRole("link", { name: /Tiếp tục mua sắm →/i });
    const btnCopy = screen.getByRole("button", { name: /Copy mã · Tra cứu đơn/i });
    const btnLookup = screen.getByRole("link", { name: /Tra cứu đơn này →/i });

    expect(btnShop).toBeInTheDocument();
    expect(btnCopy).toBeInTheDocument();
    expect(btnLookup).toBeInTheDocument();

    // Kiểm tra class responsive mobile (w-full sm:w-auto, min-h-[44px])
    expect(btnShop.className).toContain("w-full");
    expect(btnShop.className).toContain("sm:w-auto");
    expect(btnShop.className).toContain("min-h-[44px]");

    expect(btnCopy.className).toContain("w-full");
    expect(btnCopy.className).toContain("sm:w-auto");
    expect(btnCopy.className).toContain("min-h-[44px]");

    expect(btnLookup.className).toContain("w-full");
    expect(btnLookup.className).toContain("sm:w-auto");
    expect(btnLookup.className).toContain("min-h-[44px]");
  });

  it("sao chép mã đơn khi bấm nút copy", async () => {
    const mockOrder: PlacedOrder = {
      code: "LM-COPY99",
      createdAt: new Date().toISOString(),
      info: {
        fullName: "Trần Thị B",
        phone: "0912345678",
        email: "b@example.com",
        address: "456 Đường XYZ",
        province: "Hà Nội",
        district: "Hoàn Kiếm",
        note: "",
        paymentMethod: "cod",
      },
      lines: [],
      totals: { subtotal: 0, shippingFee: 0, discount: 0, total: 0 },
    };

    saveOrder(mockOrder);

    // Mock clipboard
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    render(
      <MemoryRouter initialEntries={["/dat-hang-thanh-cong?ma=LM-COPY99"]}>
        <OrderSuccessPage />
      </MemoryRouter>
    );

    const btnCopy = screen.getByRole("button", { name: /Copy mã · Tra cứu đơn/i });
    fireEvent.click(btnCopy);

    expect(writeText).toHaveBeenCalledWith("LM-COPY99");
    await waitFor(() => {
      expect(screen.getByText("Đã copy mã ✓")).toBeInTheDocument();
    });
  });
});
