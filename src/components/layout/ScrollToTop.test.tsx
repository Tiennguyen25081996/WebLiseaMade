import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";

describe("ScrollToTop", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("cuộn lên (0, 0) khi component mount", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("cuộn lên (0, 0) khi pathname thay đổi sang /san-pham", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter initialEntries={["/san-pham"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
