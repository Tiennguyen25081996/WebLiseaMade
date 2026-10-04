import { describe, expect, it } from "vitest";
import { discountPercent, formatCompact, formatVnd } from "./format";

describe("formatVnd", () => {
  it("định dạng tiền VND không có phần thập phân", () => {
    // vi-VN dùng dấu chấm phân cách nghìn; ký hiệu ₫ tuỳ runtime nên chỉ assert phần số.
    expect(formatVnd(389000)).toMatch(/389\.000/);
  });

  it("xử lý 0", () => {
    expect(formatVnd(0)).toMatch(/0/);
  });
});

describe("discountPercent", () => {
  it("tính đúng phần trăm giảm", () => {
    expect(discountPercent(389000, 459000)).toBe(15);
  });

  it("trả 0 khi không có giá gốc", () => {
    expect(discountPercent(389000, undefined)).toBe(0);
  });

  it("trả 0 khi giá gốc thấp hơn hoặc bằng giá bán", () => {
    expect(discountPercent(500000, 400000)).toBe(0);
    expect(discountPercent(500000, 500000)).toBe(0);
  });
});

describe("formatCompact", () => {
  it("rút gọn số lớn", () => {
    expect(formatCompact(187800)).toMatch(/188|187,8/);
  });
});
