import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import { FilterChips } from "./FilterChips";
import { SearchField } from "./SearchField";
import { SortPicker } from "./SortPicker";

export function AutoLayoutFilterBar({ className = "" }: React.ComponentPropsWithoutRef<"div">) {
  const { query, setQuery, reset, isFiltered } = useCatalogQuery();

  return (
    <div
      className={`w-full rounded-2xl border border-sand-200/90 bg-sand-100/70 p-4 md:p-5 backdrop-blur-sm shadow-2xs flex flex-col gap-3.5 ${className}`}
    >
      {/* Hàng 1: Tìm kiếm + Sắp xếp */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-full sm:max-w-md">
          <SearchField
            value={query.q}
            onQueryChange={(val) => setQuery({ q: val })}
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-coral-700 hover:text-coral-900 underline font-medium px-2 py-1 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
          <SortPicker
            query={query}
            onSortChange={(sort) => setQuery({ sort })}
          />
        </div>
      </div>

      {/* Hàng 2: Danh mục (Pills cuộn ngang êm ái trên mobile) */}
      <div className="pt-2 border-t border-sand-200/60">
        <FilterChips query={query} />
      </div>
    </div>
  );
}
