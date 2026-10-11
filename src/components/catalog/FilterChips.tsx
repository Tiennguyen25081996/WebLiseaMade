import { Link } from "react-router-dom";
import type { CatalogQuery, CategoryId } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { countByCategory, toSearchParams } from "@/lib/catalog";

interface FilterChipsProps {
  query: CatalogQuery;
  className?: string;
}

export function FilterChips({ query, className = "" }: FilterChipsProps) {
  const isAll = query.category === "all";

  return (
    <div
      role="group"
      aria-label="Chọn nhóm hàng"
      className={`flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 ${className}`}
    >
      {/* Chip "Tất cả" */}
      <Link
        to={`/san-pham?${toSearchParams({ ...query, category: "all" }).toString()}`}
        className={`tap-feedback shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 border ${
          isAll
            ? "bg-ink-900 text-sand-50 border-ink-900 font-medium shadow-2xs"
            : "bg-sand-50/80 text-ink-600 border-sand-200/90 hover:border-sand-300 hover:text-ink-900"
        }`}
      >
        Tất cả ({PRODUCTS.length})
      </Link>

      {/* Chips từng danh mục */}
      {CATEGORIES.map((category) => {
        const count = countByCategory(PRODUCTS, category.id);
        const isActive = category.id === query.category;

        return (
          <Link
            key={category.id}
            to={`/san-pham?${toSearchParams({ ...query, category: category.id as CategoryId }).toString()}`}
            className={`tap-feedback shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 border ${
              isActive
                ? "bg-ink-900 text-sand-50 border-ink-900 font-medium shadow-2xs"
                : "bg-sand-50/80 text-ink-600 border-sand-200/90 hover:border-sand-300 hover:text-ink-900"
            }`}
          >
            {category.name} ({count})
          </Link>
        );
      })}
    </div>
  );
}
