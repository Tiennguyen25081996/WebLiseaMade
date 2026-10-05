/**
 * Farfetch luxury filter bar layout:
 * Row 1: Category chips + Sort picker (gap 8px horizontally)
 * Row 2: Search input
 */

import { CATEGORIES } from "@/data/categories";
import PRODUCTS, { countByCategory } from "@/data/products";
import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import { SortPicker } from "./SortPicker";
import { SearchField } from "./SearchField";
import { Link } from "react-router-dom";

export function AutoLayoutFilterBar({ className = "" }: React.ComponentProps<"div">) {
  const { query, setQuery } = useCatalogQuery();

  return (
    <div className={className || "flex flex-col gap-[10px]"}>
      {/* Row 1: Categories + Sort */}
      <div className="flex items-center justify-between flex-wrap gap-[8px]">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/san-pham?${new URLSearchParams({ 
              nhom: "all", 
              tim: query.q, 
              sap_xep: query.sort 
            }).toString()}`}
            className={`text-xs font-medium tracking-[0.04em] border-b-[1px] pb-[2px] ${
              query.category === "all" 
                ? "border-[#1c1a18]/40 text-ink-900" 
                : "opacity-70 text-ink-500 hover:text-lagoon-700"
            }`}
          >
            Tất cả ({countByCategory(PRODUCTS, "all")})
          </Link>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/san-pham?${new URLSearchParams({ 
                nhom: cat.id, 
                tim: query.q, 
                sap_xep: query.sort 
              }).toString()}`}
              className={`text-xs font-medium tracking-[0.04em] border-b-[1px] pb-[2px] ${
                query.category === cat.id 
                  ? "border-[#1c1a18]/40 text-ink-900" 
                  : "opacity-70 text-ink-500 hover:text-lagoon-700"
              }`}
            >
              {cat.name} ({countByCategory(PRODUCTS, cat.id)})
            </Link>
          ))}
        </div>

        <div className="w-[20%]" />

        <SortPicker query={query} />
      </div>

      {/* Row 2: Search */}
      <SearchField className="" />
    </div>
  );
}
