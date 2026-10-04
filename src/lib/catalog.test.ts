import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUERY,
  countByCategory,
  getRelatedProducts,
  matchesQuery,
  normalizeText,
  parseCatalogQuery,
  priceBounds,
  selectProducts,
  sortProducts,
  toSearchParams,
} from "./catalog";
import type { Product } from "@/types";

function makeProduct(over: Partial<Product> & Pick<Product, "id" | "price">): Product {
  return {
    name: "Sản phẩm",
    category: "ao",
    images: [],
    shortDescription: "mô tả",
    description: "mô tả dài",
    materials: [],
    variants: [{ id: "m", label: "M", kind: "size", inStock: true }],
    rating: 4,
    reviewCount: 10,
    badges: [],
    ...over,
  };
}

const PRODUCTS: Product[] = [
  makeProduct({
    id: "ao-so-mi-hoa-dua",
    name: "Áo sơ mi hoa dừa",
    price: 389_000,
    category: "ao",
    rating: 4.8,
    reviewCount: 124,
  }),
  makeProduct({
    id: "dam-maxi",
    name: "Đầm maxi hoa anh đào",
    price: 559_000,
    category: "vay-dam",
    rating: 4.9,
    reviewCount: 86,
  }),
  makeProduct({
    id: "tui-coi",
    name: "Túi cói đan",
    price: 275_000,
    category: "phu-kien",
    rating: 4.6,
    reviewCount: 41,
  }),
  makeProduct({
    id: "dam-suong",
    name: "Đầm suông nhiệt đới",
    price: 475_000,
    category: "vay-dam",
    rating: 4.5,
    reviewCount: 52,
  }),
];

describe("normalizeText", () => {
  it("bỏ dấu tiếng Việt", () => {
    expect(normalizeText("Áo sơ mi")).toBe("ao so mi");
  });

  it("chuyển đ/Đ thành d/D", () => {
    expect(normalizeText("Đầm đẹp")).toBe("dam dep");
    expect(normalizeText("đũi")).toBe("dui");
  });

  it("lowercase và trim", () => {
    expect(normalizeText("  TÚI CÓI  ")).toBe("tui coi");
  });
});

describe("matchesQuery", () => {
  it("khớp không dấu với tên có dấu", () => {
    const p = PRODUCTS[0];
    expect(matchesQuery(p, "ao so mi")).toBe(true);
    expect(matchesQuery(p, "Áo sơ mi")).toBe(true);
  });

  it("khớp 'dam' với 'Đầm' (xử lý đ/Đ)", () => {
    expect(matchesQuery(PRODUCTS[1], "dam maxi")).toBe(true);
  });

  it("query rỗng thì luôn khớp", () => {
    expect(matchesQuery(PRODUCTS[0], "")).toBe(true);
    expect(matchesQuery(PRODUCTS[0], "   ")).toBe(true);
  });

  it("nhiều token phải khớp TẤT CẢ (AND)", () => {
    expect(matchesQuery(PRODUCTS[1], "dam maxi")).toBe(true);
    expect(matchesQuery(PRODUCTS[1], "dam tui")).toBe(false);
  });

  it("không khớp khi từ khoá không có trong sản phẩm", () => {
    expect(matchesQuery(PRODUCTS[2], "quan jean")).toBe(false);
  });
});

describe("sortProducts", () => {
  it("price-asc sắp tăng dần", () => {
    const out = sortProducts(PRODUCTS, "price-asc");
    expect(out.map((p) => p.price)).toEqual([275_000, 389_000, 475_000, 559_000]);
  });

  it("price-desc sắp giảm dần", () => {
    const out = sortProducts(PRODUCTS, "price-desc");
    expect(out[0].price).toBe(559_000);
  });

  it("rating sắp theo đánh giá cao nhất", () => {
    const out = sortProducts(PRODUCTS, "rating");
    expect(out[0].rating).toBe(4.9);
  });

  it("KHÔNG mutate mảng đầu vào", () => {
    const original = [...PRODUCTS];
    sortProducts(PRODUCTS, "price-desc");
    expect(PRODUCTS).toEqual(original);
  });
});

describe("selectProducts", () => {
  it("lọc theo nhóm", () => {
    const out = selectProducts(PRODUCTS, { ...DEFAULT_QUERY, category: "vay-dam" });
    expect(out).toHaveLength(2);
    expect(out.every((p) => p.category === "vay-dam")).toBe(true);
  });

  it("lọc theo từ khoá không dấu", () => {
    const out = selectProducts(PRODUCTS, { ...DEFAULT_QUERY, q: "tui coi" });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("tui-coi");
  });

  it("kết hợp nhóm + từ khoá + sort", () => {
    const out = selectProducts(PRODUCTS, {
      category: "vay-dam",
      q: "dam",
      sort: "price-asc",
    });
    expect(out.map((p) => p.id)).toEqual(["dam-suong", "dam-maxi"]);
  });

  it("trả mảng rỗng khi không có kết quả (không ném lỗi)", () => {
    expect(selectProducts(PRODUCTS, { ...DEFAULT_QUERY, q: "zzzz" })).toEqual([]);
  });
});

describe("getRelatedProducts", () => {
  it("cùng nhóm, loại trừ chính nó, tôn trọng limit", () => {
    const out = getRelatedProducts(PRODUCTS, PRODUCTS[1], 4);
    expect(out.every((p) => p.id !== PRODUCTS[1].id)).toBe(true);
    expect(out.every((p) => p.category === "vay-dam")).toBe(true);
    expect(out).toHaveLength(1);
  });
});

describe("countByCategory / priceBounds", () => {
  it("đếm đúng theo nhóm", () => {
    expect(countByCategory(PRODUCTS, "vay-dam")).toBe(2);
    expect(countByCategory(PRODUCTS, "all")).toBe(4);
    expect(countByCategory(PRODUCTS, "set-do")).toBe(0);
  });

  it("tìm được biên giá", () => {
    expect(priceBounds(PRODUCTS)).toEqual({ min: 275_000, max: 559_000 });
  });

  it("mảng rỗng trả biên 0/0", () => {
    expect(priceBounds([])).toEqual({ min: 0, max: 0 });
  });
});

describe("parseCatalogQuery — dữ liệu URL không hợp lệ phải fallback an toàn", () => {
  it("nhóm không hợp lệ -> 'all'", () => {
    expect(parseCatalogQuery(new URLSearchParams("nhom=khong-ton-tai")).category).toBe("all");
  });

  it("sort không hợp lệ -> 'featured'", () => {
    expect(parseCatalogQuery(new URLSearchParams("sap-xep=bua")).sort).toBe("featured");
  });

  it("URL rỗng -> mặc định", () => {
    expect(parseCatalogQuery(new URLSearchParams())).toEqual(DEFAULT_QUERY);
  });

  it("đọc đúng giá trị hợp lệ", () => {
    const q = parseCatalogQuery(
      new URLSearchParams("nhom=ao&tim=hoa&sap-xep=price-asc"),
    );
    expect(q).toEqual({ category: "ao", q: "hoa", sort: "price-asc" });
  });
});

describe("toSearchParams", () => {
  it("bỏ giá trị mặc định cho URL gọn", () => {
    expect(toSearchParams(DEFAULT_QUERY).toString()).toBe("");
  });

  it("ghi đủ giá trị khi khác mặc định", () => {
    const params = toSearchParams({ category: "ao", q: "hoa", sort: "price-desc" });
    expect(params.get("nhom")).toBe("ao");
    expect(params.get("tim")).toBe("hoa");
    expect(params.get("sap-xep")).toBe("price-desc");
  });

  it("round-trip parse(toSearchParams(q)) giữ nguyên query", () => {
    const q = { category: "phu-kien" as const, q: "tui", sort: "rating" as const };
    expect(parseCatalogQuery(toSearchParams(q))).toEqual(q);
  });
});
