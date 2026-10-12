import { useState, useMemo } from "react";
import type { Product, Category } from "@/types";
import { formatVnd } from "@/lib/format";
import { SearchIcon, TrashIcon } from "@/components/ui/icons";

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (p: Product) => void;
}

export function AdminProductsTab({
  products,
  categories,
  onEditProduct,
  onDeleteProduct,
}: AdminProductsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategoryFilter === "all" || p.category === selectedCategoryFilter;
      return matchQuery && matchCat;
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm sản phẩm theo tên hoặc mã..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-hair border border-sand-300 bg-sand-50 pl-9 pr-4 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
        >
          <option value="all">Tất cả nhóm ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-hair border border-sand-300 bg-sand-100 p-10 text-center text-xs text-ink-500">
          Không tìm thấy sản phẩm phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-hair border border-sand-300 bg-sand-50 shadow-2xs">
          <table className="w-full text-left text-xs text-ink-800">
            <thead className="border-b border-sand-200 bg-sand-100 text-eyebrow text-ink-500">
              <tr>
                <th className="py-3 px-4">Ảnh & Tên</th>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4">Giá bán</th>
                <th className="py-3 px-4">Tồn kho / Size</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {filteredProducts.map((p) => {
                const catObj = categories.find((c) => c.id === p.category);
                return (
                  <tr key={p.id} className="hover:bg-sand-100/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0] || "/figma-images/catalog-1.png"}
                          alt={p.name}
                          className="h-10 w-10 rounded-hair object-cover bg-sand-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/figma-images/catalog-1.png";
                          }}
                        />
                        <div>
                          <div className="font-medium text-ink-900">{p.name}</div>
                          {p.badges.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {p.badges.map((b) => (
                                <span
                                  key={b}
                                  className="text-[9px] bg-sand-200 px-1 py-0.2 rounded-hair text-ink-600"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-ink-500">{p.id}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-hair bg-sand-200 px-2 py-0.5 text-2xs font-medium text-ink-700">
                        {catObj?.name ?? p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-900">
                      <div>{formatVnd(p.price)}</div>
                      {p.compareAtPrice && (
                        <div className="text-[10px] text-ink-400 line-through">
                          {formatVnd(p.compareAtPrice)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-2xs text-ink-600">
                        {p.variants.map((v) => v.label).join(", ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="rounded-hair border border-sand-300 px-2.5 py-1 text-2xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p)}
                          className="rounded-hair p-1 text-coral-700 hover:bg-coral-50 transition-colors"
                          title="Xóa sản phẩm"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
