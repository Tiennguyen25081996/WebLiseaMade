import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminProductsTab } from "./AdminProductsTab";
import type { Category, Product } from "@/types";

const mockCategories: Category[] = [
  { id: "ao", name: "Áo", description: "Các loại áo" },
  { id: "vay-dam", name: "Váy & Đầm", description: "Các loại đầm" },
];

const mockProducts: Product[] = [
  {
    id: "sp-1",
    name: "Áo sơ mi Hawaii",
    price: 250000,
    category: "ao",
    images: ["/ao.jpg"],
    shortDescription: "Mô tả",
    description: "Mô tả",
    materials: ["Cotton"],
    variants: [{ id: "v1", label: "M", kind: "size", inStock: true }],
    rating: 5,
    reviewCount: 1,
    badges: ["Mới"],
  },
  {
    id: "sp-2",
    name: "Đầm maxi đi biển",
    price: 350000,
    category: "vay-dam",
    images: ["/dam.jpg"],
    shortDescription: "Mô tả",
    description: "Mô tả",
    materials: ["Voan"],
    variants: [{ id: "v2", label: "L", kind: "size", inStock: true }],
    rating: 5,
    reviewCount: 2,
    badges: [],
  },
];

describe("AdminProductsTab", () => {
  it("render danh sách sản phẩm đầy đủ", () => {
    render(
      <AdminProductsTab
        products={mockProducts}
        categories={mockCategories}
        onEditProduct={vi.fn()}
        onDeleteProduct={vi.fn()}
      />
    );

    expect(screen.getByText("Áo sơ mi Hawaii")).toBeInTheDocument();
    expect(screen.getByText("Đầm maxi đi biển")).toBeInTheDocument();
  });

  it("lọc sản phẩm theo ô tìm kiếm", () => {
    render(
      <AdminProductsTab
        products={mockProducts}
        categories={mockCategories}
        onEditProduct={vi.fn()}
        onDeleteProduct={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm sản phẩm/i);
    fireEvent.change(searchInput, { target: { value: "maxi" } });

    expect(screen.queryByText("Áo sơ mi Hawaii")).not.toBeInTheDocument();
    expect(screen.getByText("Đầm maxi đi biển")).toBeInTheDocument();
  });

  it("gọi onEditProduct khi bấm Sửa", () => {
    const onEdit = vi.fn();
    render(
      <AdminProductsTab
        products={mockProducts}
        categories={mockCategories}
        onEditProduct={onEdit}
        onDeleteProduct={vi.fn()}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: "Sửa" });
    fireEvent.click(editBtns[0]);

    expect(onEdit).toHaveBeenCalledWith(mockProducts[0]);
  });

  it("gọi onDeleteProduct khi bấm nút xóa", () => {
    const onDelete = vi.fn();
    render(
      <AdminProductsTab
        products={mockProducts}
        categories={mockCategories}
        onEditProduct={vi.fn()}
        onDeleteProduct={onDelete}
      />
    );

    const deleteBtns = screen.getAllByTitle("Xóa sản phẩm");
    fireEvent.click(deleteBtns[0]);

    expect(onDelete).toHaveBeenCalledWith(mockProducts[0]);
  });
});
