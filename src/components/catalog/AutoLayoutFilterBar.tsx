import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import { FilterChips } from "./FilterChips";
import { SearchField } from "./SearchField";
import { SortPicker } from "./SortPicker";

export function AutoLayoutFilterBar({ className = "" }: React.ComponentPropsWithoutRef<"div">) {
  const { query, setQuery, reset, isFiltered } = useCatalogQuery();

  return (
    <div
      className={`w-full rounded-2xl border border-sand-200/90 bg-sand-100/70 p-3 sm:p-4 md:p-5 backdrop-blur-sm shadow-2xs flex flex-col gap-3 ${className}`}
    >
      {/* Hàng 1: Ô tìm kiếm + Combobox sắp xếp nằm cùng 1 hàng đồng bộ chiều cao trên mọi màn hình */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <div className="flex-1 min-w-0">
          <SearchField
            value={query.q}
            onQueryChange={(val) => setQuery({ q: val })}
          />
        </div>

        <div className="shrink-0 w-[120px] sm:w-[155px]">
          <SortPicker
            query={query}
            onSortChange={(sort) => setQuery({ sort })}
          />
        </div>
      </div>

      {/* Hàng 2: Danh mục sản phẩm (Pills cuộn ngang êm ái trên mobile, có nút Xóa lọc) */}
      <div className="pt-2 border-t border-sand-200/60">
        <FilterChips query={query} isFiltered={isFiltered} onReset={reset} />
      </div>
    </div>
  );
}
