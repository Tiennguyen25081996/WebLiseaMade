import { describe, expect, it } from "vitest";
import {
  FLAT_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  amountToFreeShipping,
  clampQuantity,
  computeItemCount,
  computeShippingFee,
  computeTotals,
  hydrateLines,
} from "./cart-pricing";
import type { CartLine, CartLineDetailed, Product } from "@/types";

const product: Product = {
  id: "ao-test",
  name: "Áo test",
  price: 200_000,
  category: "ao",
  images: [],
  shortDescription: "test",
  description: "test",
  materials: [],
  variants: [
    { id: "m", label: "M", kind: "size", inStock: true },
    { id: "l", label: "L", kind: "size", inStock: false },
  ],
  rating: 5,
  reviewCount: 1,
  badges: [],
};

const catalog = [product];

function line(productId: string, variantId: string, quantity: number): CartLine {
  return { productId, variantId, quantity };
}

describe("clampQuantity", () => {
  it("giữ nguyên giá trị hợp lệ", () => {
    expect(clampQuantity(5)).toBe(5);
  });

  it("kẹp trần ở 99", () => {
    expect(clampQuantity(1000)).toBe(99);
  });

  it("trả 0 cho giá trị <= 0, làm tròn xuống số nguyên", () => {
    expect(clampQuantity(0)).toBe(0);
    expect(clampQuantity(-3)).toBe(0);
    expect(clampQuantity(2.9)).toBe(2);
  });

  it("trả 0 cho NaN/Infinity thay vì lan truyền giá trị rác", () => {
    expect(clampQuantity(Number.NaN)).toBe(0);
    expect(clampQuantity(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("hydrateLines", () => {
  it("join được dòng hợp lệ với catalog", () => {
    const { lines, droppedLineIds } = hydrateLines([line("ao-test", "m", 2)], catalog);
    expect(droppedLineIds).toHaveLength(0);
    expect(lines).toHaveLength(1);
    expect(lines[0].unitPrice).toBe(200_000);
    expect(lines[0].lineTotal).toBe(400_000);
  });

  it("loại dòng khi sản phẩm không còn trong catalog", () => {
    const { lines, droppedLineIds } = hydrateLines([line("da-xoa", "m", 1)], catalog);
    expect(lines).toHaveLength(0);
    expect(droppedLineIds).toEqual(["da-xoa::m"]);
  });

  it("loại dòng khi biến thể không còn tồn tại", () => {
    const { lines, droppedLineIds } = hydrateLines([line("ao-test", "xxl", 1)], catalog);
    expect(lines).toHaveLength(0);
    expect(droppedLineIds).toEqual(["ao-test::xxl"]);
  });

  it("loại dòng có quantity không hợp lệ (dữ liệu localStorage bị sửa tay)", () => {
    const { lines, droppedLineIds } = hydrateLines(
      [line("ao-test", "m", 0), line("ao-test", "m", -5), line("ao-test", "m", Number.NaN)],
      catalog,
    );
    expect(lines).toHaveLength(0);
    expect(droppedLineIds).toHaveLength(3);
  });

  it("kẹp quantity > 99 đọc từ localStorage", () => {
    const { lines } = hydrateLines([line("ao-test", "m", 500)], catalog);
    expect(lines[0].quantity).toBe(99);
  });
});

describe("computeShippingFee", () => {
  it("giỏ rỗng thì phí ship = 0", () => {
    expect(computeShippingFee(0, 0)).toBe(0);
  });

  it("dưới ngưỡng thì tính phí đồng giá", () => {
    expect(computeShippingFee(FREE_SHIPPING_THRESHOLD - 1, 1)).toBe(FLAT_SHIPPING_FEE);
  });

  it("đúng ngưỡng thì miễn phí ship (biên)", () => {
    expect(computeShippingFee(FREE_SHIPPING_THRESHOLD, 1)).toBe(0);
  });

  it("trên ngưỡng thì miễn phí ship", () => {
    expect(computeShippingFee(FREE_SHIPPING_THRESHOLD + 1, 1)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("tổng = tạm tính + ship - giảm giá", () => {
    const { lines } = hydrateLines([line("ao-test", "m", 1)], catalog);
    const totals = computeTotals(lines);
    expect(totals.subtotal).toBe(200_000);
    expect(totals.shippingFee).toBe(FLAT_SHIPPING_FEE);
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(200_000 + FLAT_SHIPPING_FEE);
  });

  it("đơn lớn thì không mất phí ship", () => {
    const { lines } = hydrateLines([line("ao-test", "m", 3)], catalog);
    const totals = computeTotals(lines);
    expect(totals.subtotal).toBe(600_000);
    expect(totals.shippingFee).toBe(0);
    expect(totals.total).toBe(600_000);
  });

  it("giỏ rỗng ra tất cả 0", () => {
    const totals = computeTotals([]);
    expect(totals).toEqual({ subtotal: 0, shippingFee: 0, discount: 0, total: 0 });
  });
});

describe("computeItemCount", () => {
  it("cộng dồn quantity của mọi dòng", () => {
    const detailed = [
      { quantity: 2 },
      { quantity: 3 },
    ] as CartLineDetailed[];
    expect(computeItemCount(detailed)).toBe(5);
  });
});

describe("amountToFreeShipping", () => {
  it("trả phần còn thiếu", () => {
    expect(amountToFreeShipping(FREE_SHIPPING_THRESHOLD - 200_000)).toBe(200_000);
  });

  it("không trả số âm khi đã đạt ngưỡng", () => {
    expect(amountToFreeShipping(FREE_SHIPPING_THRESHOLD + 500_000)).toBe(0);
  });
});
