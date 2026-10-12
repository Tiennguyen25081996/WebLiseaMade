import { Link } from "react-router-dom";
import type { CatalogQuery, CategoryId } from "@/types";
import { useAdminStore } from "@/lib/admin-store";
import { countByCategory, toSearchParams } from "@/lib/catalog";

interface FilterChipsProps {
  query: CatalogQuery;
  isFiltered?: boolean;
  onReset?: () => void;
  className?: string;
}

export function FilterChips({ query, isFiltered = false, onReset, className = "" }: FilterChipsProps) {
  const isAll = query.category === "all";
  const { products, categories } = useAdminStore();

  return (
    <div
      role="group"
      aria-label="Chọn nhóm hàng"
      className={`flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 ${className}`}
    >
      {/* Nút Xóa lọc nhanh khi có filter/search */}
      {isFiltered && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="tap-feedback shrink-0 px-3 py-1.5 rounded-full text-xs transition-all duration-200 border bg-coral-50 text-coral-800 border-coral-200/90 font-medium hover:bg-coral-100 flex items-center gap-1 shadow-2xs"
          aria-label="Xóa tất cả bộ lọc"
        >
          <span>✕</span> Xóa lọc
        </button>
      )}

      {/* Chip "Tất cả" */}
      <Link
        to={`/san-pham?${toSearchParams({ ...query, category: "all" }).toString()}`}
        className={`tap-feedback shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 border ${
          isAll
            ? "bg-ink-900 text-sand-50 border-ink-900 font-medium shadow-2xs"
            : "bg-sand-50/80 text-ink-600 border-sand-200/90 hover:border-sand-300 hover:text-ink-900"
        }`}
      >
        Tất cả ({products.length})
      </Link>

      {/* Chips từng danh mục */}
      {categories.map((category) => {
        const count = countByCategory(products, category.id);
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
