import { useState, useEffect } from "react";
import type { DiscountEvent } from "@/lib/admin-store";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";

interface DiscountEditModalProps {
  isOpen: boolean;
  discount: DiscountEvent | null;
  onClose: () => void;
  onSave: (discount: DiscountEvent) => void;
  showToast?: (msg: string) => void;
}

export function DiscountEditModal({
  isOpen,
  discount,
  onClose,
  onSave,
  showToast,
}: DiscountEditModalProps) {
  const [form, setForm] = useState<DiscountEvent>({
    id: "",
    code: "",
    name: "",
    type: "percentage",
    value: 10,
    minOrderValue: 200000,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: true,
    description: "",
  });

  useEffect(() => {
    if (discount) {
      setForm({ ...discount });
    } else {
      setForm({
        id: `disc-${Date.now().toString(36)}`,
        code: "PROMO" + Math.floor(1000 + Math.random() * 9000),
        name: "",
        type: "percentage",
        value: 10,
        minOrderValue: 200000,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        isActive: true,
        description: "",
      });
    }
  }, [discount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      showToast?.("Vui lòng điền mã code và tên sự kiện giảm giá!");
      return;
    }

    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <h2 className="font-display text-lg text-ink-900">
            {discount ? "Chỉnh sửa sự kiện giảm giá" : "Thêm sự kiện giảm giá mới"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="disc-code" className="block font-medium text-ink-700 mb-1">Mã Code áp dụng*</label>
              <input
                id="disc-code"
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 font-mono font-bold"
                placeholder="SUMMER2026"
              />
            </div>

            <div>
              <label htmlFor="disc-type" className="block font-medium text-ink-700 mb-1">Loại giảm giá*</label>
              <select
                id="disc-type"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "percentage" | "fixed" })
                }
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="disc-name" className="block font-medium text-ink-700 mb-1">Tên chương trình / Tiêu đề*</label>
            <input
              id="disc-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
              placeholder="Khuyến mãi Lễ Hội Mùa Hè"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="disc-value" className="block font-medium text-ink-700 mb-1">
                {form.type === "percentage" ? "Mức giảm (%)*" : "Mức giảm (VND)*"}
              </label>
              <input
                id="disc-value"
                type="number"
                min="1"
                max={form.type === "percentage" ? 100 : undefined}
                required
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
              />
            </div>

            <div>
              <label htmlFor="disc-min-order" className="block font-medium text-ink-700 mb-1">Đơn tối thiểu (VND)</label>
              <input
                id="disc-min-order"
                type="number"
                min="0"
                step="1000"
                value={form.minOrderValue ?? 0}
                onChange={(e) =>
                  setForm({ ...form, minOrderValue: Number(e.target.value) })
                }
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="disc-start-date" className="block font-medium text-ink-700 mb-1">Ngày bắt đầu</label>
              <input
                id="disc-start-date"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
              />
            </div>

            <div>
              <label htmlFor="disc-end-date" className="block font-medium text-ink-700 mb-1">Ngày kết thúc</label>
              <input
                id="disc-end-date"
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="disc-desc" className="block font-medium text-ink-700 mb-1">Mô tả chương trình</label>
            <textarea
              id="disc-desc"
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
              placeholder="Điều kiện áp dụng, chi tiết..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="disc-is-active"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 accent-ink-900"
            />
            <label htmlFor="disc-is-active" className="text-xs font-medium text-ink-900 cursor-pointer">
              Kích hoạt mã ngay sau khi lưu
            </label>
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
              {discount ? "Lưu thay đổi" : "Tạo sự kiện"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
