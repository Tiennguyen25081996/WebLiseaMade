import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

describe("ConfirmDeleteModal", () => {
  it("không hiển thị khi target = null", () => {
    const { container } = render(
      <ConfirmDeleteModal
        target={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị thông tin mục cần xóa đúng loại", () => {
    render(
      <ConfirmDeleteModal
        target={{
          type: "product",
          id: "sp-1",
          title: "Váy hoa vàng",
        }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Xác nhận xóa?")).toBeInTheDocument();
    expect(screen.getByText("Váy hoa vàng")).toBeInTheDocument();
    expect(screen.getByText(/sản phẩm/)).toBeInTheDocument();
  });

  it("gọi onConfirm khi click Xóa ngay", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteModal
        target={{
          type: "category",
          id: "cat-1",
          title: "Áo đầm",
        }}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const deleteBtn = screen.getByRole("button", { name: "Xóa ngay" });
    fireEvent.click(deleteBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("gọi onClose khi click Hủy", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDeleteModal
        target={{
          type: "discount",
          id: "disc-1",
          title: "Mã TEST",
        }}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Hủy" });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
