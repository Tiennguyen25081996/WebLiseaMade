import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiscountEditModal } from "./DiscountEditModal";
import type { DiscountEvent } from "@/lib/admin-store";

const mockDiscount: DiscountEvent = {
  id: "disc-1",
  code: "SUMMER20",
  name: "Ưu đãi hè",
  type: "percentage",
  value: 20,
  minOrderValue: 200000,
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  isActive: true,
  description: "Giảm 20% đón hè",
};

describe("DiscountEditModal", () => {
  it("không hiển thị khi isOpen = false", () => {
    const { container } = render(
      <DiscountEditModal
        isOpen={false}
        discount={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị form thêm mới khi discount = null", () => {
    render(
      <DiscountEditModal
        isOpen={true}
        discount={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Thêm sự kiện giảm giá mới")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo sự kiện" })).toBeInTheDocument();
  });

  it("điền sẵn dữ liệu khi chỉnh sửa sự kiện giảm giá", () => {
    render(
      <DiscountEditModal
        isOpen={true}
        discount={mockDiscount}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Chỉnh sửa sự kiện giảm giá")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SUMMER20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ưu đãi hè")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();
  });

  it("gọi onSave khi submit form", () => {
    const onSave = vi.fn();
    render(
      <DiscountEditModal
        isOpen={true}
        discount={null}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const nameInput = screen.getByLabelText(/Tên chương trình/i);
    fireEvent.change(nameInput, { target: { value: "Khuyến mãi cuối tuần" } });

    const submitBtn = screen.getByRole("button", { name: "Tạo sự kiện" });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].name).toBe("Khuyến mãi cuối tuần");
  });
});
