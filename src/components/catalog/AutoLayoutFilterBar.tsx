import { CATEGORIES } from "@/data/categories";
import PRODUCTS from "@/data/products";
import { countByCategory } from "@/lib/catalog";
import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import { SortPicker } from "./SortPicker";
import { SearchField } from "./SearchField";
import { Link } from "react-router-dom";

export function AutoLayoutFilterBar({ className = "" }: React.ComponentPropsWithoutRef<"div">) {
  const { query, setQuery } = useCatalogQuery();

  return (
    <div className={className || "flex flex-col gap-[10px]"}>
      {/* Row 1: Categories + Sort */}
      <div className="flex items-center justify-between flex-wrap gap-[8px]">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => {
            const count = countByCategory(PRODUCTS, category.id);
            const isActive = query.category === category.id;

            return (
              <Link
                key={category.id}
                to={`/san-pham?${new URLSearchParams({ 
                  nhom: isActive ? category.id : "all",
                  tim: query.q,
                  sap_xep: query.sort
                }).toString()}`}
                className={`text-xs font-medium tracking-[0.04em] border-b-[1px] pb-[2px] ${
                  isActive 
                    ? "border-[#1c1a18]/40 text-ink-900" 
                    : "opacity-70 text-ink-500 hover:text-lagoon-700"
                }`}
              >
                {category.name} ({count})
              </Link>
            );
          })}
        </div>

        <div className="w-[20%]" />

        <SortPicker query={query} />
      </div>

      {/* Row 2: Search */}
      <SearchField onQueryChange={(value) => setQuery({ ...query, q: value })} />
    </div>
  );
}
