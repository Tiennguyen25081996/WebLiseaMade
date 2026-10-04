import { CATALOG_IS_PLACEHOLDER, PRODUCTS } from "@/data/products";
import { priceBounds, selectProducts } from "@/lib/catalog";
import { formatVnd } from "@/lib/format";
import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/catalog/EmptyState";
import { FilterChips } from "@/components/catalog/FilterChips";
import { SortPicker } from "@/components/catalog/SortPicker";
import { SearchField } from "@/components/catalog/SearchField";

/**
 * Trang danh mục: lọc theo nhóm, sắp xếp và tìm kiếm sản phẩm.
 * Trạng thái filter/sort đồng bộ với URL nên link chia sẻ được.
 */
export default function CatalogPage() {
  const { query, setQuery } = useCatalogQuery();
  const results = selectProducts(PRODUCTS, query);
  const bounds = priceBounds(results);

  return (
    <div className="container-page pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-ink-900">Sản phẩm</h1>
          <p className="text-sm text-ink-500">
            {results.length} sản phẩm
            {results.length === 0
              ? ""
              : ` · giá từ ${formatVnd(bounds.min)} đến ${formatVnd(bounds.max)}`}
          </p>
        </div>

        {CATALOG_IS_PLACEHOLDER && (
          <div className="rounded-xl bg-sand-100 p-4 ring-1 ring-sand-300">
            <p className="text-sm font-semibold text-sand-900">
              Catalog mẫu: tên, giá và mô tả sản phẩm là dữ liệu minh hoạ do team dựng
              web soạn, chưa phải danh mục hàng thật của shop.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
          <FilterChips active={query.category} />
          <SortPicker query={query} />
          <SearchField
            onQueryChange={(value) => {
              setQuery({ q: value });
            }}
          />
        </div>

        {results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
