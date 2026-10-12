import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LayoutMobileWrapper } from "./LayoutMobile";
import { CartProvider } from "@/context/CartProvider";

describe("LayoutMobileWrapper", () => {
  it("không hiển thị MobileFooter khi đang ở trang admin", () => {
    render(
      <CartProvider>
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route element={<LayoutMobileWrapper />}>
              <Route path="/admin" element={<div>Trang Admin</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    expect(screen.getByText("Trang Admin")).toBeInTheDocument();
    expect(screen.queryByLabelText("Điều hướng chính di động")).not.toBeInTheDocument();
  });

  it("hiển thị MobileFooter với 5 tab mua hàng khi ở trang cửa hàng", () => {
    render(
      <CartProvider>
        <MemoryRouter initialEntries={["/san-pham"]}>
          <Routes>
            <Route element={<LayoutMobileWrapper />}>
              <Route path="/san-pham" element={<div>Trang Cửa hàng</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    expect(screen.getByText("Trang Cửa hàng")).toBeInTheDocument();
    expect(screen.getByLabelText("Điều hướng chính di động")).toBeInTheDocument();
  });
});
