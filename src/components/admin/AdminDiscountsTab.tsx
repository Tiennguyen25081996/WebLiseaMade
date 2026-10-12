import type { DiscountEvent } from "@/lib/admin-store";
import { formatVnd } from "@/lib/format";
import { TrashIcon } from "@/components/ui/icons";

interface AdminDiscountsTabProps {
  discounts: DiscountEvent[];
  onToggleDiscount: (id: string) => void;
  onEditDiscount: (d: DiscountEvent) => void;
  onDeleteDiscount: (d: DiscountEvent) => void;
}

export function AdminDiscountsTab({
  discounts,
  onToggleDiscount,
  onEditDiscount,
  onDeleteDiscount,
}: AdminDiscountsTabProps) {
  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-hair border border-sand-300 bg-sand-50 shadow-2xs">
        <table className="w-full text-left text-xs text-ink-800">
          <thead className="border-b border-sand-200 bg-sand-100 text-eyebrow text-ink-500">
            <tr>
              <th className="py-3 px-4">Mã ưu đãi</th>
              <th className="py-3 px-4">Tên chương trình</th>
              <th className="py-3 px-4">Mức giảm</th>
              <th className="py-3 px-4">Đơn tối thiểu</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-sand-100/60 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold tracking-wider text-ink-900 bg-sand-200 px-2 py-0.5 rounded-hair">
                    {d.code}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-ink-900">
                  <div>{d.name}</div>
                  {d.description && (
                    <div className="text-[10px] text-ink-500 mt-0.5">{d.description}</div>
                  )}
                </td>
                <td className="py-3 px-4 font-semibold text-coral-700">
                  {d.type === "percentage" ? `Giảm ${d.value}%` : `Giảm ${formatVnd(d.value)}`}
                </td>
                <td className="py-3 px-4 text-ink-600">
                  {d.minOrderValue ? formatVnd(d.minOrderValue) : "Không giới hạn"}
                </td>
                <td className="py-3 px-4 text-2xs text-ink-500">
                  {d.startDate} → {d.endDate}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => onToggleDiscount(d.id)}
                    className={`rounded-full px-2.5 py-0.5 text-2xs font-medium cursor-pointer transition-colors ${
                      d.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-sand-200 text-ink-500 hover:bg-sand-300"
                    }`}
                  >
                    {d.isActive ? "● Đang bật" : "○ Tạm tắt"}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditDiscount(d)}
                      className="rounded-hair border border-sand-300 px-2.5 py-1 text-2xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDiscount(d)}
                      className="rounded-hair p-1 text-coral-700 hover:bg-coral-50 transition-colors"
                      title="Xóa sự kiện"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
