import type { CatalogQuery, CategoryId, Product, SortKey } from "@/types";
import { CATEGORIES } from "@/data/categories";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Nổi bật" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
];

export const DEFAULT_QUERY: CatalogQuery = {
  category: "all",
  q: "",
  sort: "featured",
};

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu ("ao dai" khớp "áo dài"). */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** Từ khoá khớp nếu xuất hiện trong tên, mô tả ngắn hoặc nhóm hàng. */
export function matchesQuery(product: Product, rawQuery: string): boolean {
  const q = normalizeText(rawQuery);
  if (!q) return true;
  const haystack = normalizeText(
    [product.name, product.shortDescription, product.category, ...product.badges].join(" "),
  );
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export function sortProducts(products: readonly Product[], sort: SortKey): Product[] {
  const out = [...products];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, "vi"));
    case "price-desc":
      return out.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name, "vi"));
    case "rating":
      return out.sort(
        (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      );
    case "featured":
    default:
      return out;
  }
}

/** Lọc theo nhóm + từ khoá, sau đó sắp xếp. Không mutate mảng đầu vào. */
export function selectProducts(
  products: readonly Product[],
  query: CatalogQuery,
): Product[] {
  const byCategory =
    query.category === "all"
      ? [...products]
      : products.filter((p) => p.category === query.category);
  const byQuery = byCategory.filter((p) => matchesQuery(p, query.q));
  return sortProducts(byQuery, query.sort);
}

export function getProductById(
  products: readonly Product[],
  id: string,
): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(
  products: readonly Product[],
  slug: string,
): Product | undefined {
  return products.find((p) => p.id === slug);
}

export function getVariant(product: Product, variantId: string) {
  return product.variants.find((v) => v.id === variantId);
}

/** Sản phẩm cùng nhóm, ưu tiên giá gần nhau, loại trừ chính nó. */
export function getRelatedProducts(
  products: readonly Product[],
  product: Product,
  limit = 4,
): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, limit);
}

export function countByCategory(
  products: readonly Product[],
  category: CategoryId | "all",
): number {
  return category === "all"
    ? products.length
    : products.filter((p) => p.category === category).length;
}

/** Khoảng giá thấp nhất / cao nhất của một tập sản phẩm. */
export function priceBounds(products: readonly Product[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 0 };
  let min = products[0].price;
  let max = products[0].price;
  for (const p of products) {
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }
  return { min, max };
}

/** Đọc CatalogQuery từ URLSearchParams, tự động fallback về mặc định. */
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const rawCategory = params.get("nhom") ?? "";
  const rawSort = params.get("sap-xep") ?? "";
  const sort = SORT_OPTIONS.some((o) => o.value === rawSort)
    ? (rawSort as SortKey)
    : DEFAULT_QUERY.sort;

  // Nhóm không hợp lệ trên URL -> coi như "tất cả" thay vì lọc ra rỗng.
  const category: CategoryId | "all" = CATEGORIES.some((c) => c.id === rawCategory)
    ? (rawCategory as CategoryId)
    : "all";

  return {
    category,
    q: params.get("tim") ?? "",
    sort,
  };
}

/** Ghi CatalogQuery ra URLSearchParams, bỏ các giá trị mặc định cho URL gọn. */
export function toSearchParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.category !== "all") params.set("nhom", query.category);
  if (query.q.trim()) params.set("tim", query.q.trim());
  if (query.sort !== "featured") params.set("sap-xep", query.sort);
  return params;
}
