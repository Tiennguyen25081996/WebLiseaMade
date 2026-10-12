import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminDiscountsTab } from "./AdminDiscountsTab";
import type { DiscountEvent } from "@/lib/admin-store";

const mockDiscounts: DiscountEvent[] = [
  {
    id: "disc-1",
    code: "SUMMER10",
    name: "Ưu đãi mùa hè",
    type: "percentage",
    value: 10,
    minOrderValue: 200000,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    isActive: true,
  },
  {
    id: "disc-2",
    code: "OFF50K",
    name: "Giảm 50K",
    type: "fixed",
    value: 50000,
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    isActive: false,
  },
];

describe("AdminDiscountsTab", () => {
  it("render danh sách mã ưu đãi và trạng thái", () => {
    render(
      <AdminDiscountsTab
        discounts={mockDiscounts}
        onToggleDiscount={vi.fn()}
        onEditDiscount={vi.fn()}
        onDeleteDiscount={vi.fn()}
      />
    );

    expect(screen.getByText("SUMMER10")).toBeInTheDocument();
    expect(screen.getByText("OFF50K")).toBeInTheDocument();
    expect(screen.getByText("● Đang bật")).toBeInTheDocument();
    expect(screen.getByText("○ Tạm tắt")).toBeInTheDocument();
  });

  it("gọi onToggleDiscount khi bấm nút trạng thái", () => {
    const onToggle = vi.fn();
    render(
      <AdminDiscountsTab
        discounts={mockDiscounts}
        onToggleDiscount={onToggle}
        onEditDiscount={vi.fn()}
        onDeleteDiscount={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: "● Đang bật" });
    fireEvent.click(toggleBtn);

    expect(onToggle).toHaveBeenCalledWith("disc-1");
  });

  it("gọi onEditDiscount khi bấm Sửa", () => {
    const onEdit = vi.fn();
    render(
      <AdminDiscountsTab
        discounts={mockDiscounts}
        onToggleDiscount={vi.fn()}
        onEditDiscount={onEdit}
        onDeleteDiscount={vi.fn()}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: "Sửa" });
    fireEvent.click(editBtns[0]);

    expect(onEdit).toHaveBeenCalledWith(mockDiscounts[0]);
  });

  it("gọi onDeleteDiscount khi bấm Xóa", () => {
    const onDelete = vi.fn();
    render(
      <AdminDiscountsTab
        discounts={mockDiscounts}
        onToggleDiscount={vi.fn()}
        onEditDiscount={vi.fn()}
        onDeleteDiscount={onDelete}
      />
    );

    const deleteBtns = screen.getAllByTitle("Xóa sự kiện");
    fireEvent.click(deleteBtns[0]);

    expect(onDelete).toHaveBeenCalledWith(mockDiscounts[0]);
  });
});
