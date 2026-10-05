import { CATALOG_IS_PLACEHOLDER, PRODUCTS } from "@/data/products";
import { priceBounds, selectProducts } from "@/lib/catalog";
import { useMemo } from "react";
import { formatVnd } from "@/lib/format";
import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import type { CatalogQuery } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/catalog/EmptyState";
import { FilterChips } from "@/components/catalog/FilterChips";
import { SortPicker } from "@/components/catalog/SortPicker";
import { SearchField } from "@/components/catalog/SearchField";

export default function CatalogPage() {
  const { query, setQuery } = useCatalogQuery();
  const { results, bounds } = useMemo(
    () => ({
      results: selectProducts(PRODUCTS, query),
      bounds: priceBounds(selectProducts(PRODUCTS, query)),
    }),
    [query]
  );

  return (
    <div className="container-page pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-display-lg text-ink-900 tracking-[−0.02em]">Sản phẩm</h1>
          <p className="text-sm text-ink-500">
            {results.length} sản phẩm
            {results.length === 0 ? "" : ` · giá từ ${formatVnd(bounds.min)} đến ${formatVnd(bounds.max)}`}
          </p>
        </div>

        {CATALOG_IS_PLACEHOLDER && (
          <div className="rounded-hair bg-sand-100 p-5 border-1 border-sand-200">
            <p className="text-xs font-light text-ink-500 tracking-[0.04em] uppercase">
              ✨ Catalog Editorial: All product names and prices are presented as 
              editorial references — creative mockups for the LiseaMade aesthetic.
            </p>
          </div>
        )}

        <div className="rounded-hair bg-sand-100 p-5 border-1 border-sand-200">
          <FilterChips query={query} />
          <SortPicker query={query} />
          <SearchField onQueryChange={(value) => setQuery({ ...query, q: value })} />
        </div>

        {results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
