import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryEditModal } from "./CategoryEditModal";
import type { Category } from "@/types";

const mockCategory: Category = {
  id: "ao",
  name: "Áo sơ mi",
  description: "Các mẫu áo sơ mi phong cách Hawaii",
};

describe("CategoryEditModal", () => {
  it("không hiển thị khi isOpen = false", () => {
    const { container } = render(
      <CategoryEditModal
        isOpen={false}
        category={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị form tạo mới khi category = null", () => {
    render(
      <CategoryEditModal
        isOpen={true}
        category={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Thêm loại sản phẩm mới")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo loại sản phẩm" })).toBeInTheDocument();
  });

  it("điền sẵn dữ liệu khi chỉnh sửa loại sản phẩm", () => {
    render(
      <CategoryEditModal
        isOpen={true}
        category={mockCategory}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Chỉnh sửa loại sản phẩm")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Áo sơ mi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();
  });

  it("gọi onSave khi submit form hợp lệ", () => {
    const onSave = vi.fn();
    render(
      <CategoryEditModal
        isOpen={true}
        category={null}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const nameInput = screen.getByLabelText(/Tên loại sản phẩm/i);
    fireEvent.change(nameInput, { target: { value: "Phụ kiện đi biển" } });

    const submitBtn = screen.getByRole("button", { name: "Tạo loại sản phẩm" });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].name).toBe("Phụ kiện đi biển");
  });
});
