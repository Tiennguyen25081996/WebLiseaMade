import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminCategoriesTab } from "./AdminCategoriesTab";
import type { Category, Product } from "@/types";

const mockCategories: Category[] = [
  { id: "ao", name: "Áo", description: "Các loại áo sơ mi" },
  { id: "vay-dam", name: "Váy & Đầm", description: "Váy xòe phong cách hè" },
];

const mockProducts: Product[] = [
  {
    id: "sp-1",
    name: "Áo sơ mi",
    price: 200000,
    category: "ao",
    images: ["/ao.jpg"],
    shortDescription: "",
    description: "",
    materials: [],
    variants: [],
    rating: 5,
    reviewCount: 1,
    badges: [],
  },
];

describe("AdminCategoriesTab", () => {
  it("render bảng loại sản phẩm và đếm đúng số lượng sản phẩm", () => {
    render(
      <AdminCategoriesTab
        categories={mockCategories}
        products={mockProducts}
        onEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
      />
    );

    expect(screen.getByText("Áo")).toBeInTheDocument();
    expect(screen.getByText("Váy & Đầm")).toBeInTheDocument();
    expect(screen.getByText("1 sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("0 sản phẩm")).toBeInTheDocument();
  });

  it("gọi onEditCategory khi bấm Sửa", () => {
    const onEdit = vi.fn();
    render(
      <AdminCategoriesTab
        categories={mockCategories}
        products={mockProducts}
        onEditCategory={onEdit}
        onDeleteCategory={vi.fn()}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: "Sửa" });
    fireEvent.click(editBtns[0]);

    expect(onEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it("gọi onDeleteCategory khi bấm Xóa", () => {
    const onDelete = vi.fn();
    render(
      <AdminCategoriesTab
        categories={mockCategories}
        products={mockProducts}
        onEditCategory={vi.fn()}
        onDeleteCategory={onDelete}
      />
    );

    const deleteBtns = screen.getAllByTitle("Xóa loại sản phẩm");
    fireEvent.click(deleteBtns[0]);

    expect(onDelete).toHaveBeenCalledWith(mockCategories[0]);
  });
});
