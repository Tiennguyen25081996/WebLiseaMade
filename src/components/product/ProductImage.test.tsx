import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductImage } from "./ProductImage";

describe("ProductImage", () => {
  it("render thẻ img khi có src", () => {
    render(<ProductImage src="/test.jpg" alt="Váy xinh" />);
    const img = screen.getByRole("img", { name: "Váy xinh" });
    expect(img).toHaveAttribute("src", "/test.jpg");
  });

  it("rơi về placeholder khi ảnh bị lỗi onError", () => {
    render(<ProductImage src="/broken.jpg" alt="Váy lỗi" />);
    const img = screen.getByRole("img", { name: "Váy lỗi" });
    fireEvent.error(img);

    expect(screen.queryByRole("img", { name: "Váy lỗi" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Váy lỗi (ảnh minh hoạ)")).toBeInTheDocument();
  });

  it("tự động reset trạng thái failed khi src thay đổi sang URL mới", () => {
    const { rerender } = render(<ProductImage src="/broken.jpg" alt="Váy hoa" />);
    const img = screen.getByRole("img", { name: "Váy hoa" });
    fireEvent.error(img);

    // Đang ở trạng thái placeholder
    expect(screen.getByLabelText("Váy hoa (ảnh minh hoạ)")).toBeInTheDocument();

    // Admin cập nhật ảnh mới
    rerender(<ProductImage src="/new-fixed-image.jpg" alt="Váy hoa" />);

    // Thẻ img với ảnh mới được render lại
    const newImg = screen.getByRole("img", { name: "Váy hoa" });
    expect(newImg).toHaveAttribute("src", "/new-fixed-image.jpg");
  });

  it("tự động chuẩn hóa link Google Drive sang CDN trực tiếp", () => {
    render(
      <ProductImage
        src="https://drive.google.com/file/d/1XyZ_testDriveId/view?usp=sharing"
        alt="Váy maxi"
      />
    );
    const img = screen.getByRole("img", { name: "Váy maxi" });
    expect(img).toHaveAttribute("src", "https://lh3.googleusercontent.com/d/1XyZ_testDriveId");
  });
});
