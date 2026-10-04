import type { Category } from "@/types";

/** Bốn nhóm hàng chính của storefront. */
export const CATEGORIES: Category[] = [
  {
    id: "ao",
    name: "Áo",
    description: "Áo sơ mi, áo thun form rộng phong cách nhiệt đới.",
  },
  {
    id: "vay-dam",
    name: "Váy & Đầm",
    description: "Váy hoa, đầm maxi nhẹ bay cho ngày nắng.",
  },
  {
    id: "set-do",
    name: "Set đồ",
    description: "Set bộ phối sẵn, mặc là đẹp, khỏi nghĩ nhiều.",
  },
  {
    id: "phu-kien",
    name: "Phụ kiện",
    description: "Túi cói, nón rộng vành, kính và phụ kiện đi biển.",
  },
];

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryName(id: string): string {
  return getCategory(id)?.name ?? "Khác";
}
