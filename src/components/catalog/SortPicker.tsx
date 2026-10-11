import type { CatalogQuery, SortKey } from "@/types";
import { SORT_OPTIONS } from "@/lib/catalog";

interface SortPickerProps {
  query: CatalogQuery;
  onSortChange?: (sort: SortKey) => void;
  className?: string;
}

export function SortPicker({ query, onSortChange, className = "" }: SortPickerProps) {
  return (
    <div className={`relative flex items-center w-full min-w-0 ${className}`}>
      <label htmlFor="catalog-sort" className="sr-only">
        Sắp xếp theo
      </label>
      <select
        id="catalog-sort"
        value={query.sort}
        onChange={(e) => {
          if (onSortChange) {
            onSortChange(e.target.value as SortKey);
          }
        }}
        style={{ WebkitAppearance: "none", MozAppearance: "none" }}
        className="h-10 w-full appearance-none bg-sand-50/90 border border-sand-300/80 rounded-full pl-3 pr-7 text-base sm:text-sm font-medium text-ink-800 hover:border-ink-900/60 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900/20 transition-all cursor-pointer shadow-2xs truncate"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 flex items-center text-ink-500" aria-hidden>
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
}
