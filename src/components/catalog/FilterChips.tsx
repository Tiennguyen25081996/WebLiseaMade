import { Link } from "react-router-dom";
import type { CatalogQuery } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { countByCategory, toSearchParams } from "@/lib/catalog";

interface FilterChipsProps {
  /** Nhóm hàng đang chọn; chip đang chọn hiển thị dạng plain text thay vì link. */
  query: CatalogQuery;
}

/**
 * Chọn nhóm hàng: mỗi nhóm là một link `/san-pham?nhom=...` để URL chia sẻ được.
 * Chip đang chọn hiển thị bằng <span> nên click không re-navigate không cần thiết.
 */
export function FilterChips({ query }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Chọn nhóm hàng"
      className="flex flex-wrap items-center gap-2"
    >
      {CATEGORIES.map((category) => {
        const count = countByCategory(PRODUCTS, category.id);
        const isActive = category.id === query.category;
        const label = `${category.name} (${count})`;

        if (isActive) {
          return (
            <span
              key={category.id}
              className="py-1 text-sm font-medium text-ink-900 border-b-1 border-ink-900/40"
            >
              {label}
            </span>
          );
        }

        if (count === 0) {
          return (
            <span
              key={category.id}
              className="py-1 text-sm font-medium text-ink-500"
            >
              {label}
            </span>
          );
        }

        const params = toSearchParams({ ...query, category: category.id });
        return (
          <Link
            key={category.id}
            to={`/san-pham?${params.toString()}`}
            className="underline-reveal py-1 text-sm font-medium text-ink-700 hover:text-lagoon-700"
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
