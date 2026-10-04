import { Link } from "react-router-dom";
import type { CategoryId } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { DEFAULT_QUERY, countByCategory, toSearchParams } from "@/lib/catalog";

interface FilterChipsProps {
  /** Nhóm hàng đang chọn; chip đang chọn hiển thị dạng plain text thay vì link. */
  active: CategoryId | "all";
}

/**
 * Chọn nhóm hàng: mỗi nhóm là một link `/san-pham?nhom=...` để URL chia sẻ được.
 * Chip đang chọn hiển thị bằng <span> nên click không re-navigate không cần thiết.
 */
export function FilterChips({ active }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Chọn nhóm hàng"
      className="flex flex-wrap items-center gap-2"
    >
      {CATEGORIES.map((category) => {
        const count = countByCategory(PRODUCTS, category.id);
        const isActive = category.id === active;
        const label = `${category.name} (${count})`;

        if (isActive) {
          return (
            <span
              key={category.id}
              className="rounded-full bg-lagoon-100 px-3 py-1 text-sm font-semibold text-lagoon-800"
            >
              {label}
            </span>
          );
        }

        if (count === 0) {
          return (
            <span
              key={category.id}
              className="rounded-full px-3 py-1 text-sm font-medium text-ink-500"
            >
              {label}
            </span>
          );
        }

        const params = toSearchParams({ ...DEFAULT_QUERY, category: category.id });
        return (
          <Link
            key={category.id}
            to={`/san-pham?${params.toString()}`}
            className="rounded-full px-3 py-1 text-sm font-semibold text-lagoon-700 hover:bg-lagoon-100"
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
