import { Link } from "react-router-dom";
import type { CatalogQuery } from "@/types";
import { SORT_OPTIONS, toSearchParams } from "@/lib/catalog";

interface SortPickerProps {
  query: CatalogQuery;
}

export function SortPicker({ query }: SortPickerProps) {
  return (
    <div
      role="group"
      aria-label="Chọn thứ tự sắp xếp"
      className="flex flex-wrap items-center gap-2"
    >
      {SORT_OPTIONS.map((option) => {
        const isActive = option.value === query.sort;
        const label = `Sắp xếp: ${option.label}`;

        if (isActive) {
          return (
            <span
              key={option.value}
              className="py-1 text-sm font-medium text-ink-900 border-b-1 border-ink-900/40"
            >
              {label}
            </span>
          );
        }

        const params = toSearchParams({ ...query, sort: option.value });
        return (
          <Link
            key={option.value}
            to={`/san-pham?${params.toString()}`}
            className="underline-reveal py-1 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
