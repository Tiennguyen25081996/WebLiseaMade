import { useState, useEffect } from "react";
import type { Category, CategoryId } from "@/types";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";

interface CategoryEditModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (category: Category) => void;
  showToast?: (msg: string) => void;
}

export function CategoryEditModal({
  isOpen,
  category,
  onClose,
  onSave,
  showToast,
}: CategoryEditModalProps) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setForm({
        id: category.id,
        name: category.name,
        description: category.description,
      });
    } else {
      setForm({
        id: `cat-${Date.now().toString(36)}`,
        name: "",
        description: "",
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id.trim() || !form.name.trim()) {
      showToast?.("Vui lòng điền mã và tên loại sản phẩm!");
      return;
    }

    const finalCat: Category = {
      id: form.id.trim() as CategoryId,
      name: form.name.trim(),
      description: form.description.trim(),
    };

    onSave(finalCat);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <h2 className="font-display text-lg text-ink-900">
            {category ? "Chỉnh sửa loại sản phẩm" : "Thêm loại sản phẩm mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label htmlFor="cat-id" className="block font-medium text-ink-700 mb-1">Mã định danh (ID / Slug)*</label>
            <input
              id="cat-id"
              type="text"
              required
              value={form.id}
              disabled={Boolean(category)}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 disabled:bg-sand-200 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="cat-name" className="block font-medium text-ink-700 mb-1">Tên loại sản phẩm*</label>
            <input
              id="cat-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
            />
          </div>

          <div>
            <label htmlFor="cat-desc" className="block font-medium text-ink-700 mb-1">Mô tả ngắn</label>
            <textarea
              id="cat-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {category ? "Lưu thay đổi" : "Tạo loại sản phẩm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
