import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductEditModal } from "./ProductEditModal";
import type { Category, Product } from "@/types";

const mockCategories: Category[] = [
  { id: "ao", name: "Áo", description: "Các loại áo" },
  { id: "vay-dam", name: "Váy & Đầm", description: "Các loại váy" },
];

const mockProduct: Product = {
  id: "sp-1",
  name: "Áo sơ mi Hawaii",
  price: 250000,
  compareAtPrice: 300000,
  category: "ao",
  images: ["/test-1.jpg"],
  shortDescription: "Mô tả ngắn",
  description: "Mô tả chi tiết",
  materials: ["Lụa"],
  variants: [{ id: "v-1", label: "M", kind: "size", inStock: true }],
  rating: 5,
  reviewCount: 1,
  badges: ["Hot"],
};

describe("ProductEditModal", () => {
  it("không hiển thị khi isOpen = false", () => {
    const { container } = render(
      <ProductEditModal
        isOpen={false}
        product={null}
        categories={mockCategories}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị form thêm mới khi product = null", () => {
    render(
      <ProductEditModal
        isOpen={true}
        product={null}
        categories={mockCategories}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Thêm sản phẩm mới")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm sản phẩm" })).toBeInTheDocument();
  });

  it("điền sẵn dữ liệu khi chỉnh sửa sản phẩm có sẵn", () => {
    render(
      <ProductEditModal
        isOpen={true}
        product={mockProduct}
        categories={mockCategories}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Chỉnh sửa sản phẩm")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Áo sơ mi Hawaii")).toBeInTheDocument();
    expect(screen.getByDisplayValue("250000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();
  });

  it("gọi onSave với thông tin sản phẩm mới khi submit form", () => {
    const onSave = vi.fn();
    render(
      <ProductEditModal
        isOpen={true}
        product={null}
        categories={mockCategories}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const nameInput = screen.getByLabelText(/Tên sản phẩm/i);
    fireEvent.change(nameInput, { target: { value: "Đầm maxi hoa cúc" } });

    const submitBtn = screen.getByRole("button", { name: "Thêm sản phẩm" });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].name).toBe("Đầm maxi hoa cúc");
  });
});
