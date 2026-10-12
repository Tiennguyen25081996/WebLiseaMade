import type { Category, Product } from "@/types";
import { TrashIcon } from "@/components/ui/icons";

interface AdminCategoriesTabProps {
  categories: Category[];
  products: Product[];
  onEditCategory: (c: Category) => void;
  onDeleteCategory: (c: Category) => void;
}

export function AdminCategoriesTab({
  categories,
  products,
  onEditCategory,
  onDeleteCategory,
}: AdminCategoriesTabProps) {
  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-hair border border-sand-300 bg-sand-50 shadow-2xs">
        <table className="w-full text-left text-xs text-ink-800">
          <thead className="border-b border-sand-200 bg-sand-100 text-eyebrow text-ink-500">
            <tr>
              <th className="py-3 px-4">Tên loại</th>
              <th className="py-3 px-4">Mã định danh (Slug)</th>
              <th className="py-3 px-4">Mô tả</th>
              <th className="py-3 px-4">Số lượng sản phẩm</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200">
            {categories.map((c) => {
              const prodCount = products.filter((p) => p.category === c.id).length;
              return (
                <tr key={c.id} className="hover:bg-sand-100/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink-900">{c.name}</td>
                  <td className="py-3 px-4 font-mono text-2xs text-ink-500">{c.id}</td>
                  <td className="py-3 px-4 text-ink-600 max-w-xs truncate">{c.description}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-sand-200 px-2 py-0.5 text-2xs font-semibold text-ink-700">
                      {prodCount} sản phẩm
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditCategory(c)}
                        className="rounded-hair border border-sand-300 px-2.5 py-1 text-2xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c)}
                        className="rounded-hair p-1 text-coral-700 hover:bg-coral-50 transition-colors"
                        title="Xóa loại sản phẩm"
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
    </div>
  );
}
